import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large payloads for base64 images

// Routes
import extractAnswersRouter from './routes/extract-answers';
import extractQuestionsRouter from './routes/extract-questions';
import generateRubricsRouter from './routes/generate-rubrics';
import gradeRouter from './routes/grade';
import reconcileRouter from './routes/reconcile';

app.use('/api/extract-answers', extractAnswersRouter);
app.use('/api/extract-questions', extractQuestionsRouter);
app.use('/api/generate-rubrics', generateRubricsRouter);
app.use('/api/grade', gradeRouter);
app.use('/api/reconcile', reconcileRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
