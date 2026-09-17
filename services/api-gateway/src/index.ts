import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet'; import cors from 'cors'; import morgan from 'morgan';
import proxy from 'express-http-proxy';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { createClient } from 'redis';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.GATEWAY_PORT || 80;
const publicKey = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem');
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const RATE_MAX  = parseInt(process.env.RATE_LIMIT_MAX || '200');

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch(console.error);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-secret', 'x-request-id'],
  exposedHeaders: ['x-request-id'],
  credentials: true,
}));

// ─── Correlation ID middleware ────────────────────────────────────────────────
// Generates or propagates a unique request ID for distributed tracing.
// Every downstream service receives it as x-request-id and echoes it back.
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.headers['x-request-id'] = requestId;   // forward to downstream
  res.setHeader('x-request-id', requestId);   // echo back to client
  next();
});

// ─── Morgan with request ID ───────────────────────────────────────────────────
morgan.token('req-id', (req: Request) => req.headers['x-request-id'] as string || '-');
app.use(morgan(':req-id :method :url :status :res[content-length] - :response-time ms'));

// ─── RBAC permission map ───────────────────────────────────────────────────────
const PERMISSIONS: Record<string, string[]> = {
  '/api/auth':        ['*'],
  '/api/students':    ['super_admin','college_admin','faculty','student'],
  '/api/faculty':     ['super_admin','college_admin','faculty'],
  '/api/attendance':  ['super_admin','college_admin','faculty','student','parent'],
  '/api/exams':       ['super_admin','college_admin','examination_cell','student','parent'],
  '/api/fees':        ['super_admin','college_admin','student','parent'],
  '/api/notifications':['*'],
  '/api/placement':   ['super_admin','college_admin','placement_cell','student'],
  '/api/analytics':   ['super_admin','college_admin','faculty','student','parent'],
  '/api/ai':          ['super_admin','college_admin','faculty','student','placement_cell'],
};

// Fine-grained deny rules: [method, pathStartsWith, deniedRoles]
// Evaluated before the prefix allow list — matching rule → 403 immediately.
const DENY_RULES: Array<[string, string, string[]]> = [
  // Students may not list all students (only admins/faculty)
  ['GET',    '/api/students',       ['student','parent','examination_cell','placement_cell']],
  // Only admins/examCell may create exam schedules
  ['POST',   '/api/exams/schedules',['student','parent','faculty','placement_cell']],
  // Only admins may delete students
  ['DELETE', '/api/students/',      ['faculty','student','parent','examination_cell','placement_cell']],
  // Only admins/students may post fee transactions (not parent)
  ['POST',   '/api/fees/transactions',['parent','faculty','examination_cell','placement_cell']],
];

// ─── JWT + RBAC middleware ─────────────────────────────────────────────────────
function authenticate(req: Request, res: Response, next: NextFunction) {
  // Skip auth for auth routes (login/refresh/logout/forgot-password/verify-email/reset-password)
  if (req.path.startsWith('/api/auth/login')          ||
      req.path.startsWith('/api/auth/refresh')         ||
      req.path.startsWith('/api/auth/logout')          ||
      req.path.startsWith('/api/auth/forgot-password') ||
      req.path.startsWith('/api/auth/reset-password')  ||
      req.path === '/health') {
    return next();
  }
  // Skip JWT for internal service-to-service routes authenticated by x-internal-secret
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
  if (
    req.path === '/api/notifications/send' &&
    internalSecret &&
    req.headers['x-internal-secret'] === internalSecret
  ) {
    return next();
  }
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ success: false, message: 'No token provided' }); return; }
  try {
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as {
      userId: string; role: string; institutionId?: string; email: string;
    };
    // Fine-grained deny rules (method + path prefix)
    for (const [method, pathPrefix, deniedRoles] of DENY_RULES) {
      if (req.method === method && req.path.startsWith(pathPrefix) && deniedRoles.includes(payload.role)) {
        res.status(403).json({ success: false, message: 'Forbidden: insufficient role' }); return;
      }
    }
    // RBAC check
    const matchedPrefix = Object.keys(PERMISSIONS).find(p => req.path.startsWith(p));
    if (matchedPrefix) {
      const allowed = PERMISSIONS[matchedPrefix];
      if (!allowed.includes('*') && !allowed.includes(payload.role)) {
        res.status(403).json({ success: false, message: 'Forbidden: insufficient role' }); return;
      }
    }
    // Inject claims as headers for downstream services
    req.headers['x-user-id'] = payload.userId;
    req.headers['x-user-role'] = payload.role;
    req.headers['x-user-email'] = payload.email;
    if (payload.institutionId) req.headers['x-institution-id'] = payload.institutionId;
    req.headers['x-internal-secret'] = process.env.INTERNAL_SERVICE_SECRET || '';
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ─── Rate limiting ─────────────────────────────────────────────────────────────
async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string || req.ip;
  const key = `rl:${userId}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.pExpire(key, WINDOW_MS);
    if (count > RATE_MAX) {
      res.status(429).json({ success: false, message: 'Rate limit exceeded. Try again later.' }); return;
    }
  } catch { /* Redis unavailable — fail open */ }
  next();
}

// ─── Cache middleware (GET only) ───────────────────────────────────────────────
async function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET') return next();
  const cacheKey = `cache:${req.path}:${JSON.stringify(req.query)}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) { res.setHeader('X-Cache', 'HIT'); res.json(JSON.parse(cached)); return; }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      redis.setEx(cacheKey, 120, JSON.stringify(body)).catch(() => {});
      return originalJson(body);
    };
  } catch { /* fail open */ }
  next();
}

app.use(authenticate);
app.use(rateLimiter);

// ─── Proxy routes ──────────────────────────────────────────────────────────────
// Preserve full request path AND forward correlation ID to all downstream services.
const proxyWithFullPath = (target: string) =>
  proxy(target, {
    parseReqBody:         false,   // do not buffer body — stream it directly
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // Ensure x-request-id is forwarded (already set by correlation middleware above)
      if (srcReq.headers['x-request-id']) {
        (proxyReqOpts.headers as Record<string, string>)['x-request-id'] =
          srcReq.headers['x-request-id'] as string;
      }
      return proxyReqOpts;
    },
    proxyErrorHandler: (_err: Error, _res: Response, next: NextFunction) => {
      next(Object.assign(new Error('Upstream service error'), { statusCode: 502 }));
    },
  });

app.use('/api/auth',          proxyWithFullPath(process.env.AUTH_SERVICE_URL      || 'http://auth-service:3001'));
app.use('/api/students',      proxyWithFullPath(process.env.STUDENT_SERVICE_URL   || 'http://student-service:3002'));
app.use('/api/faculty',       proxyWithFullPath(process.env.FACULTY_SERVICE_URL   || 'http://faculty-service:3003'));
app.use('/api/attendance',    proxyWithFullPath(process.env.ATTENDANCE_SERVICE_URL|| 'http://attendance-service:3004'));
app.use('/api/exams',         proxyWithFullPath(process.env.EXAM_SERVICE_URL      || 'http://examination-service:3005'));
app.use('/api/fees',          proxyWithFullPath(process.env.FEE_SERVICE_URL       || 'http://fee-service:3006'));
app.use('/api/notifications', proxyWithFullPath(process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007'));
app.use('/api/placement',     proxyWithFullPath(process.env.PLACEMENT_SERVICE_URL || 'http://placement-service:3008'));
app.use('/api/analytics',     proxyWithFullPath(process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3009'));
app.use('/api/ai',            proxyWithFullPath(process.env.AI_SERVICE_URL        || 'http://ai-service:8000'));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// Standardized error handler
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.statusCode || 500;
  console.error(`[Gateway Error] ${err.message}`);
  res.status(status).json({ success: false, message: status === 502 ? 'Service unavailable' : 'Internal gateway error' });
});

app.listen(PORT, () => console.log(`API Gateway on port ${PORT}`));
