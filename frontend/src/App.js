import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Login from './components/Login';
import Register from './components/Register';
import SummaryModal from './components/SummaryModal';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState('login'); // 'login' or 'register'
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState({ groq: false, gemini: false, cohere: false });
  const [conversations, setConversations] = useState({
    groq: [{ role: 'assistant', content: 'Hello! I\'m Groq (Llama 3.1). Send a message to all chatbots!', timestamp: new Date().toISOString() }],
    gemini: [{ role: 'assistant', content: 'Hello! I\'m Gemini 2.5 Flash. Ready to chat!', timestamp: new Date().toISOString() }],
    cohere: [{ role: 'assistant', content: 'Hello! I\'m Cohere (Command R). Let\'s chat together!', timestamp: new Date().toISOString() }]
  });
  const [summaryModal, setSummaryModal] = useState({ isOpen: false, summary: '', loading: false });
  const [showUserMenu, setShowUserMenu] = useState(false);

  const messagesEndRefs = {
    groq: useRef(null),
    gemini: useRef(null),
    cohere: useRef(null)
  };

  const bots = [
    { id: 'groq', name: 'Groq (Llama 3.1)', color: '#6366f1', icon: '⚡' },
    { id: 'gemini', name: 'Gemini 2.5 Flash', color: '#f59e0b', icon: '✨' },
    { id: 'cohere', name: 'Cohere (Command R)', color: '#10b981', icon: '🚀' }
  ];

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Error parsing saved user:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    Object.values(messagesEndRefs).forEach(ref => {
      ref.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [conversations]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowUserMenu(false);
    // Reset conversations
    setConversations({
      groq: [{ role: 'assistant', content: 'Hello! I\'m Groq (Llama 3.1). Send a message to all chatbots!', timestamp: new Date().toISOString() }],
      gemini: [{ role: 'assistant', content: 'Hello! I\'m Gemini 2.5 Flash. Ready to chat!', timestamp: new Date().toISOString() }],
      cohere: [{ role: 'assistant', content: 'Hello! I\'m Cohere (Command R). Let\'s chat together!', timestamp: new Date().toISOString() }]
    });
  };

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

  const generateSummary = async () => {
    const hasConversations = Object.values(conversations).some(
      conv => conv.filter(msg => msg.role === 'user').length > 0
    );

    if (!hasConversations) {
      setSummaryModal({ isOpen: true, summary: '', loading: false });
      return;
    }

    setSummaryModal({ isOpen: true, summary: '', loading: true });

    try {
      const response = await axios.post('/api/chatbot/summary', {
        conversations
      });

      setSummaryModal({
        isOpen: true,
        summary: response.data.summary,
        loading: false
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryModal({
        isOpen: true,
        summary: `Error generating summary: ${error.response?.data?.error || error.message}`,
        loading: false
      });
    }
  };

  const closeSummaryModal = () => {
    setSummaryModal({ isOpen: false, summary: '', loading: false });
  };

  // Show auth screens if not logged in
  if (!user) {
    if (showAuth === 'register') {
      return (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setShowAuth('login')}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowAuth('register')}
      />
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="app-logo">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="header-title">
              <h1>AI Comparison Hub</h1>
              <p>Compare responses from multiple AI models</p>
            </div>
          </div>

          <div className="header-right">
            <button className="summary-button" onClick={generateSummary}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Summary
            </button>
            <button className="clear-button" onClick={clearAllChats}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Clear
            </button>

            <div className="user-menu">
              <button
                className="user-avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button onClick={handleLogout} className="logout-button">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="chatbots-grid">
        {bots.map(bot => (
          <div key={bot.id} className="chatbot-column">
            <div className="chatbot-header" style={{ background: bot.color }}>
              <span className="bot-icon">{bot.icon}</span>
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
          className="send-button"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Send to All
        </button>
      </div>

      <SummaryModal
        isOpen={summaryModal.isOpen}
        onClose={closeSummaryModal}
        summary={summaryModal.summary}
        loading={summaryModal.loading}
      />
    </div>
  );
}

export default App;
