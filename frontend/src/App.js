import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState({ groq: false, gemini: false, cohere: false });
  const [conversations, setConversations] = useState({
    groq: [{ role: 'assistant', content: 'Hello! I\'m Groq (Llama 3.1). Send a message to all chatbots!', timestamp: new Date().toISOString() }],
    gemini: [{ role: 'assistant', content: 'Hello! I\'m Gemini 2.5 Flash. Ready to chat!', timestamp: new Date().toISOString() }],
    cohere: [{ role: 'assistant', content: 'Hello! I\'m Cohere (Command R). Let\'s chat together!', timestamp: new Date().toISOString() }]
  });

  const messagesEndRefs = {
    groq: useRef(null),
    gemini: useRef(null),
    cohere: useRef(null)
  };

  const bots = [
    { id: 'groq', name: 'Groq (Llama 3.1)', color: '#4F46E5' },
    { id: 'gemini', name: 'Gemini 2.5 Flash', color: '#F59E0B' },
    { id: 'cohere', name: 'Cohere (Command R)', color: '#10B981' }
  ];

  useEffect(() => {
    Object.values(messagesEndRefs).forEach(ref => {
      ref.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [conversations]);

  const sendMessageToBot = async (botId, message, conversationHistory) => {
    try {
      const response = await axios.post(`/api/chatbot/${botId}`, {
        message,
        conversationHistory
      });

      return {
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error(`${botId} error:`, error);
      return {
        role: 'assistant',
        content: `Error: ${error.response?.data?.error || error.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    // Add user message to all conversations
    setConversations(prev => ({
      groq: [...prev.groq, userMessage],
      gemini: [...prev.gemini, userMessage],
      cohere: [...prev.cohere, userMessage]
    }));

    setInput('');
    setLoading({ groq: true, gemini: true, cohere: true });

    // Send to all bots in parallel
    const promises = bots.map(bot => {
      const conversationHistory = conversations[bot.id]
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      return sendMessageToBot(bot.id, input, conversationHistory)
        .then(response => ({ botId: bot.id, response }));
    });

    // Handle responses as they come in
    promises.forEach(promise => {
      promise.then(({ botId, response }) => {
        setConversations(prev => ({
          ...prev,
          [botId]: [...prev[botId], response]
        }));
        setLoading(prev => ({ ...prev, [botId]: false }));
      });
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearAllChats = () => {
    setConversations({
      groq: [{ role: 'assistant', content: 'Hello! I\'m Groq (Llama 3.1). Send a message to all chatbots!', timestamp: new Date().toISOString() }],
      gemini: [{ role: 'assistant', content: 'Hello! I\'m Gemini 2.5 Flash. Ready to chat!', timestamp: new Date().toISOString() }],
      cohere: [{ role: 'assistant', content: 'Hello! I\'m Cohere (Command R). Let\'s chat together!', timestamp: new Date().toISOString() }]
    });
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>AI Chatbot Comparison</h1>
        <p>Send one prompt to all 3 AI models and compare responses</p>
        <button className="clear-all-button" onClick={clearAllChats}>
          Clear All Chats
        </button>
      </header>

      <div className="chatbots-grid">
        {bots.map(bot => (
          <div key={bot.id} className="chatbot-column">
            <div className="chatbot-header" style={{ backgroundColor: bot.color }}>
              <h2>{bot.name}</h2>
            </div>

            <div className="messages-container">
              {conversations[bot.id].map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.role} ${message.isError ? 'error' : ''}`}
                >
                  <div className="message-content">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <div className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {loading[bot.id] && (
                <div className="message assistant">
                  <div className="message-content loading">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRefs[bot.id]} />
            </div>
          </div>
        ))}
      </div>

      <div className="shared-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here and send to all 3 chatbots..."
          rows="2"
          disabled={Object.values(loading).some(l => l)}
        />
        <button
          onClick={sendMessage}
          disabled={Object.values(loading).some(l => l) || !input.trim()}
        >
          Send to All
        </button>
      </div>
    </div>
  );
}

export default App;
