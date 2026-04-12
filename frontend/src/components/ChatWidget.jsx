import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../AuthContext';
import { Send, User as UserIcon, Mic } from 'lucide-react';

export default function ChatWidget({ onAction }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { text: `System online. Welcome, ${user?.name || 'Operator'}. How may I assist with your ledger today?`, isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideText) => {
    const text = typeof overrideText === 'string' ? overrideText : input.trim();
    if (!text) return;

    const userMessage = { text, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        sessionId,
        message: text
      });

      setMessages(prev => [...prev, { text: res.data.reply, isBot: true }]);

      if (res.data.requiresAction) {
        onAction(res.data.requiresAction);
      }
    } catch (err) {
      setMessages(prev => [...prev, { text: "Protocol error: Connection lost.", isBot: true }]);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`message-wrapper ${m.isBot ? 'bot' : 'user'}`}>
            <div className="avatar">
              {m.isBot ? '⬢' : <UserIcon size={12} />}
            </div>
            <div className="message-content">
              <div className="message-bubble">{m.text}</div>
              <div className="timestamp">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-section">
        <form className="input-form" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Instruct the Finance AI..." 
            value={input} 
            onChange={e => setInput(e.target.value)}
          />
          <div className="input-actions">
            <button type="button" className={`voice-btn ${isListening ? 'active' : ''}`} onClick={startListening}>
              <Mic size={18} />
            </button>
            <button type="submit" className="send-btn">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      <style jsx="true">{`
        .chat-interface {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #000;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .message-wrapper {
          display: flex;
          gap: 15px;
          max-width: 80%;
        }
        .message-wrapper.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .avatar {
          width: 28px;
          height: 28px;
          background: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          font-size: 14px;
          font-weight: 800;
        }
        .bot .avatar {
          background: #ffcc00;
          color: #000;
        }
        .message-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .user .message-content {
          align-items: flex-end;
        }
        .message-bubble {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          padding: 12px 18px;
          border-radius: 0 4px 4px 4px;
          font-size: 0.95rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        .user .message-bubble {
          background: #111;
          border-color: #222;
          border-radius: 4px 0 4px 4px;
        }
        .timestamp {
          font-size: 8px;
          color: #444;
          letter-spacing: 1px;
        }
        .chat-input-section {
          padding: 30px 40px;
          background: #000;
          border-top: 1px solid #111;
        }
        .input-form {
          background: #0a0a0a;
          border: 1px solid #222;
          display: flex;
          padding: 8px;
          border-radius: 4px;
        }
        .input-form input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          padding: 10px 15px;
          font-size: 0.95rem;
          outline: none;
        }
        .input-actions {
          display: flex;
          gap: 5px;
        }
        .voice-btn, .send-btn {
          background: transparent;
          border: none;
          color: #666;
          padding: 8px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .voice-btn:hover, .send-btn:hover {
          color: #fff;
          background: #111;
        }
        .voice-btn.active {
          color: #ff4444;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
