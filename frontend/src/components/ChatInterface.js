import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './ChatInterface.css';

function ChatInterface({ botType, botName, botColor }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Reset chat when bot changes
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `Hello! I'm ${botName}. How can I help you today?`,
      timestamp: new Date().toISOString()
    }]);
  }, [botType, botName]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Prepare conversation history
      const conversationHistory = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await axios.post(`/api/chatbot/${botType}`, {
        message: input,
        conversationHistory
      });

      const botMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.response?.data?.error || error.message}. Please make sure the API key is configured correctly.`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Hello! I'm ${botName}. How can I help you today?`,
      timestamp: new Date().toISOString()
    }]);
  };

  return (
    <div className="chat-interface">
      <div className="chat-header" style={{ backgroundColor: botColor }}>
        <h2>{botName}</h2>
        <button className="clear-button" onClick={clearChat} title="Clear Chat">
          Clear
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
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
        {loading && (
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
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          rows="1"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{ backgroundColor: botColor }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;
