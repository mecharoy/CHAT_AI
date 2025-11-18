import express from 'express';
import {
  chatWithGroq,
  chatWithGemini,
  chatWithCohere,
  chatWithGroqMixtral,
  generateSummary
} from '../services/chatbotService.js';

const router = express.Router();

// Groq Chatbot Endpoint (Llama 3)
router.post('/groq', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatWithGroq(message, conversationHistory);
    res.json({
      bot: 'groq',
      model: 'Llama 3.1',
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Groq error:', error);
    res.status(500).json({ error: error.message || 'Error with Groq chatbot' });
  }
});

// Gemini Chatbot Endpoint (Now uses Groq Mixtral 8x7B)
router.post('/gemini', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Changed here: now uses Mixtral model from Groq
    const response = await chatWithGroqMixtral(message, conversationHistory);
    res.json({
      bot: 'groq',
      model: 'Mixtral 8x7B',
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mixtral (Gemini route) error:', error);
    res.status(500).json({ error: error.message || 'Error with Mixtral chatbot' });
  }
});

// Cohere Chatbot Endpoint (Command R)
router.post('/cohere', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatWithCohere(message, conversationHistory);
    res.json({
      bot: 'cohere',
      model: 'Command R',
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cohere error:', error);
    res.status(500).json({ error: error.message || 'Error with Cohere chatbot' });
  }
});

// Summary Endpoint - Generate summary of all conversations
router.post('/summary', async (req, res) => {
  try {
    const { conversations } = req.body;

    if (!conversations) {
      return res.status(400).json({ error: 'Conversations are required' });
    }

    const summary = await generateSummary(conversations);
    res.json({
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ error: error.message || 'Error generating summary' });
  }
});

export default router;
