import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import chatbotRoutes from './routes/chatbotRoutes.js';
import authRoutes from './routes/authRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import connectDB from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (optional - will fall back to JSON storage if unavailable)
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Chatbot Server is running',
    chatbots: ['groq', 'gemini', 'cohere']
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Available chatbots: Groq (Llama 3.1), Gemini (Mixtral 8x7B), Cohere (Command R)`);
});
