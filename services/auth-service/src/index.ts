import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { connectRedis } from './config/redis';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

// ─── Swagger ───────────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'EduIntel AI — Auth Service', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ────────────────────────────────────────────────────────────────────
// Gateway now uses proxyReqPathResolver to preserve full path — mount at /api/auth
app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Boot ──────────────────────────────────────────────────────────────────────
async function main() {
  await connectRedis();
  app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));
}

main().catch(console.error);
