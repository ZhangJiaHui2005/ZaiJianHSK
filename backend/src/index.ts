import express, { Request, Response } from 'express';
import cors from 'cors';
import './config/loadEnv.js';
import connectDB from './config/db.js';
import userRoutes from './routes/users.js';
import vocabularyRoutes from './routes/vocabulary.js';
import deckRoutes from './routes/deck.js';
import { clerkMiddleware } from '@clerk/express';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/decks', deckRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'ZaiJianHSK Backend API' });
});

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();

export default app;
