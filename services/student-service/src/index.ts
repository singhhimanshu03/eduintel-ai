import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import studentRoutes from './routes/student.routes';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet()); app.use(cors()); app.use(express.json());
morgan.token('req-id', (req: express.Request) => (req.headers['x-request-id'] as string) || '-');
app.use(morgan(':req-id :method :url :status - :response-time ms'));

app.use('/api/students', studentRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'student-service' }));

app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : 'Internal server error' });
});

app.listen(PORT, () => console.log(`Student service on port ${PORT}`));
