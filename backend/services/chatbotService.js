import axios from 'axios';
import dotenv from 'dotenv';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

dotenv.config();

// Groq Chatbot using Llama 3.1
export async function chatWithGroq(message, conversationHistory = []) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  try {
    // Build conversation messages
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant powered by Llama 3.1.' },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    throw new Error('Failed to get response from Groq');
  }
}





// Gemini Chatbot using Gemini 2.5 Flash
export async function chatWithGemini(message, conversationHistory = []) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    // Build conversation contents for Gemini
    const contents = [];

    // Add conversation history
    conversationHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    // Extract text from Gemini response
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Unexpected response format from Gemini');
    }
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    throw new Error('Failed to get response from Gemini');
  }
}




// Cohere Chatbot using Command R
export async function chatWithCohere(message, conversationHistory = []) {
  const COHERE_API_KEY = process.env.COHERE_API_KEY;

  if (!COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY is not configured');
  }

  try {
    // Build chat history in Cohere format
    const chatHistory = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'USER' : 'CHATBOT',
      message: msg.content
    }));

    const response = await axios.post(
      'https://api.cohere.com/v2/chat',
      {
        model: 'command-r-08-2024',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant powered by Cohere.'
          },
          ...conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: message
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.message.content[0].text;
  } catch (error) {
    console.error('Cohere API Error:', error.response?.data || error.message);
    throw new Error('Failed to get response from Cohere');
  }
}

// Groq Chatbot using Mixtral 8x7B
export async function chatWithGroqMixtral(message, conversationHistory = []) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  try {
    // Build conversation messages
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant powered by Mixtral 8x7B.' },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    throw new Error('Failed to get response from Groq');
  }
}

// Generate Summary of All Conversations
export async function generateSummary(conversations) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  try {
    // Format conversations for summary
    let conversationText = '';

    Object.entries(conversations).forEach(([botName, messages]) => {
      conversationText += `\n\n=== ${botName.toUpperCase()} CONVERSATION ===\n`;
      messages.forEach(msg => {
        if (msg.role === 'user') {
          conversationText += `User: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          conversationText += `${botName}: ${msg.content}\n`;
        }
      });
    });

    const summaryPrompt = `Please provide a comprehensive summary of the following conversations from three different AI chatbots (Groq, Gemini, and Cohere).

Analyze and summarize:
1. The main topics discussed
2. Key differences in how each bot responded
3. Notable insights or unique perspectives from each bot
4. Overall quality and helpfulness of responses

Conversations:
${conversationText}

Please provide a well-structured summary with clear sections.`;

    const messages = [
      { role: 'system', content: 'You are an expert at analyzing and summarizing conversations. Provide clear, insightful summaries.' },
      { role: 'user', content: summaryPrompt }
    ];

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.5,
        max_tokens: 2048
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Summary Generation Error:', error.response?.data || error.message);
    throw new Error('Failed to generate summary');
  }
}


