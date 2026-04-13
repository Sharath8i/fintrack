import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../AuthContext';
import { Send, User as UserIcon, Mic, Plus, List, Edit2 } from 'lucide-react';

const TASK_MENU = [
  { label: 'CREATE EXPENSE', icon: <Plus size={14} />, message: '1' },
  { label: 'VIEW EXPENSES',  icon: <List size={14} />, message: '2' },
  { label: 'MODIFY/DELETE',  icon: <Edit2 size={14} />, message: '3' },
];

function TransactionDraftCard({ data, onConfirm, onEdit }) {
  if (!data) return null;
  const merchant = data.description || "Unspecified";
  const category = data.category || "General";
  const cardType = data.cardType || "Standard";
  const amount = data.amount || 0;
  const fullName = data.fullName || "Guest User";
  const date = data.date || "Today";
  const contact = data.contactNumber || "N/A";
  const email = data.email || "N/A";
  const draftId = data.shortId || "NEW-TX";

  return (
    <div style={{
      background: '#050505',
      border: '1px solid #1a1a1a',
      borderLeft: '4px solid #ffcc00',
      borderRadius: 4,
      padding: '24px',
      marginTop: 12,
      width: '100%',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: '#ffcc00', marginBottom: 4 }}>EXPENSE DRAFT</div>
          <div style={{ fontSize: 8, color: '#444', letterSpacing: 1 }}>REF: {draftId}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>₹{amount}</div>
          <div style={{ fontSize: 8, color: '#444', fontWeight: 700 }}>VERIFIED AMOUNT</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 8, color: '#444', letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>OPERATOR NAME</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{fullName}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#444', letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>ENTRY DATE</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{date}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#444', letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>MERCHANT / DESC</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{merchant}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#444', letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>CATEGORY</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{category}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#444', letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>PAYMENT SOURCE</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{cardType}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#444', letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>CONTACT VERIFIED</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{contact}</div>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ fontSize: 8, color: '#444', letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>REGISTERED EMAIL</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{email}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={onConfirm}
          style={{
            flex: 2,
            background: '#ffcc00',
            border: 'none',
            color: '#000',
            padding: '12px',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.5,
            borderRadius: 2,
            cursor: 'pointer'
          }}
        >SAVE TO LEDGER</button>
        <button 
          onClick={onEdit}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid #222',
            color: '#666',
            padding: '12px',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.5,
            borderRadius: 2,
            cursor: 'pointer'
          }}
        >AMEND</button>
      </div>
    </div>
  );
}

function TaskControlPanel({ onSelect }) {
  return (
    <div style={{
      background: '#050505',
      border: '1px solid #1a1a1a',
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 8,
      width: '100%',
    }}>
      <div style={{ fontSize: 9, color: '#444', letterSpacing: 2, fontWeight: 800, padding: '10px 14px 6px', borderBottom: '1px solid #111' }}>TASK CONTROL</div>
      {TASK_MENU.map((item) => (
        <button
          key={item.label}
          onClick={() => onSelect(item.message)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'transparent', border: 'none',
            borderBottom: '1px solid #111', padding: '14px 16px',
            cursor: 'pointer', color: '#fff', fontSize: 11, fontWeight: 800,
            letterSpacing: 1.5, textAlign: 'left', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#0a0a0a'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span>{item.label}</span>
          <span style={{ color: '#333' }}>{item.icon}</span>
        </button>
      ))}
    </div>
  );
}

export default function ChatWidget({ onAction }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { isBot: true, isMenu: true, text: `Welcome back, ${user?.name?.split(' ')[0] || 'Operator'}. Select an operation below:` }
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
        message: text,
        userContext: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone
        }
      });

      setMessages(prev => [...prev, { 
        text: res.data.reply, 
        isBot: true, 
        isMenu: res.data.state === 'MENU',
        draftData: res.data.draftData
      }]);

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
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`message-node ${m.isBot ? 'bot' : 'user'}`}>
            <div className="node-avatar">
              {m.isBot ? '⬢' : <UserIcon size={16} />}
            </div>
            <div className="node-content">
              <div className="bubble">
                {m.text}
                {m.isMenu && m.isBot && <TaskControlPanel onSelect={(msg) => handleSend(msg)} />}
                {m.draftData && m.isBot && (
                  <TransactionDraftCard 
                    data={m.draftData} 
                    onConfirm={() => handleSend("yes")}
                    onEdit={() => setInput("change description to ")}
                  />
                )}
              </div>
              <div className="timestamp">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {m.isBot ? 'AI_AGENT' : 'USER_AUTH'}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form className="input-wrapper" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Instruct the Finance AI..." 
            value={input} 
            onChange={e => setInput(e.target.value)}
          />
          <div className="input-actions">
            <button type="button" className={`icon-btn ${isListening ? 'active' : ''}`} onClick={startListening}>
              <Mic size={18} />
            </button>
            <button type="submit" className="icon-btn" style={{ color: 'var(--accent)' }}>
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
