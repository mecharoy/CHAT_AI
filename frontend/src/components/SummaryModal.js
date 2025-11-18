import React from 'react';
import ReactMarkdown from 'react-markdown';
import './SummaryModal.css';

function SummaryModal({ isOpen, onClose, summary, loading }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Conversation Summary</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="summary-loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Generating summary...</p>
            </div>
          ) : summary ? (
            <div className="summary-content">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          ) : (
            <p className="no-summary">No conversations to summarize yet. Start chatting with the AI bots!</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-footer-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SummaryModal;
