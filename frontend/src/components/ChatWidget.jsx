import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../AuthContext';
import { Send, User as UserIcon, Mic, Plus, List, Edit2 } from 'lucide-react';

// --- 5. Highlight important bot messages ---
const parseText = (text) => {
  if (!text) return null;
  return text.split(/(\*\*[\s\S]*?\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#ffcc00' }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

const TASK_MENU = [
  { label: 'CREATE EXPENSE', icon: <Plus size={14} />, message: '1' },
  { label: 'VIEW EXPENSES', icon: <List size={14} />, message: '2' },
  { label: 'MODIFY/DELETE', icon: <Edit2 size={14} />, message: '3' },
];

function TransactionDraftCard({ data, onConfirm, onEdit }) {
  if (!data) return null;
  const isSaved = data.isSaved || false;
  const merchant = data.description || "Unspecified";
  const category = data.category || "General";
  const cardType = data.card_type || "Standard";
  const amount = data.amount || 0;
  const fullName = data.full_name || "Guest User";
  const date = data.date || "Today";
  const contact = data.contact_number || "N/A";
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

      {isSaved ? (
        <div style={{
          background: 'rgba(255, 204, 0, 0.1)',
          border: '1px solid #ffcc00',
          color: '#ffcc00',
          padding: '12px',
          fontSize: 10,
          fontWeight: 900,
          textAlign: 'center',
          letterSpacing: 1.5,
          borderRadius: 2
        }}>✅ LEDGERED & VERIFIED</div>
      ) : (
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
      )}
    </div>
  );
}

function QuickReplies({ options, onSelect }) {
  if (!options || options.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(opt)}
          style={{
            background: 'rgba(255, 204, 0, 0.1)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            letterSpacing: '0.05em'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 204, 0, 0.1)'; e.currentTarget.style.color = 'var(--accent)'; }}
        >
          {opt.toUpperCase()}
        </button>
      ))}
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
    { isBot: true, isMenu: true, text: `Welcome back, ${user?.name?.split(' ')[0] || 'Operator'}. Select an operation below or try: **"Spent 500 on food"**` }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [emptyWarning, setEmptyWarning] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  const placeholders = [
    "e.g. 'Spent ₹500 on Uber today'...",
    "e.g. 'Show total spending'...",
    "e.g. 'Bought groceries for 1200'..."
  ];
  const [phIdx, setPhIdx] = useState(0);

  useEffect(() => {
    const int = setInterval(() => setPhIdx(prev => (prev + 1) % placeholders.length), 4000);
    return () => clearInterval(int);
  }, []);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const pendingFAQ = sessionStorage.getItem('pendingFAQPrompt');
    if (pendingFAQ) {
      sessionStorage.removeItem('pendingFAQPrompt');
      setTimeout(() => handleSend(pendingFAQ), 500);
    }
  }, []);

  const handleSend = async (overrideText) => {
    const text = typeof overrideText === 'string' ? overrideText : input.trim();
    if (!text) {
      setEmptyWarning(true);
      setTimeout(() => setEmptyWarning(false), 2000);
      return;
    }

    const userMessage = { text, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      setIsTyping(true);
      const res = await axios.post(`${API_BASE}/api/chat`, {
        sessionId,
        message: text,
        userContext: { name: user?.name, email: user?.email, phone: user?.phone }
      });

      const { bot_reply, extracted_data, intent, is_ready_for_api, missing_fields, quick_replies } = res.data;
      setIsTyping(false);

      setMessages(prev => [...prev, {
        text: bot_reply,
        isBot: true,
        isMenu: intent === 'GeneralQuery' && !extracted_data?.amount,
        quickReplies: quick_replies || [],
        draftData: (intent === 'CreateExpense' && (missing_fields === undefined || missing_fields.length === 0)) ? extracted_data : null
      }]);

      if (is_ready_for_api) {
        onAction('REFRESH_ANALYTICS');
        onAction('LOAD_HISTORY');
      }
    } catch (err) {
      setIsTyping(false);
      // --- 4. Improve error messages ---
      setMessages(prev => [...prev, { text: "⚠️ Oops! Our AI servers are busy. Please try again.", isBot: true }]);
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
                {parseText(m.text)}
                {m.quickReplies && m.isBot && <QuickReplies options={m.quickReplies} onSelect={(msg) => handleSend(msg)} />}
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
        {isTyping && (
          <div className="message-node bot">
            <div className="node-avatar">⬢</div>
            <div className="node-content">
              <div className="bubble" style={{ display: 'flex', gap: '4px', padding: '10px 14px' }}>
                <style>{`
                  @keyframes slideUpFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                  .node-content .bubble { animation: slideUpFade 0.3s ease-out both; }
                  @keyframes bounceDelay { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-4px); } }
                  .tdot { width: 6px; height: 6px; background-color: var(--accent); border-radius: 50%; display: inline-block; animation: bounceDelay 1.4s infinite ease-in-out both; }
                  .tdot1 { animation-delay: -0.32s; }
                  .tdot2 { animation-delay: -0.16s; }
                `}</style>
                <div className="tdot tdot1"></div>
                <div className="tdot tdot2"></div>
                <div className="tdot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>



      <div className="input-area" style={{ position: 'relative' }}>

        {emptyWarning && (
          <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#000', fontSize: '10px', padding: '6px 14px', borderRadius: '4px', fontWeight: 900, letterSpacing: '1px', boxShadow: '0 4px 12px rgba(255, 204, 0, 0.2)', transition: 'opacity 0.2s' }}>
            INPUT CANNOT BE EMPTY
          </div>
        )}
        <form className="input-wrapper" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholders[phIdx]}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isTyping}
            style={{ opacity: isTyping ? 0.5 : 1, transition: 'all 0.3s ease' }}
          />
          <div className="input-actions">
            <button type="button" className={`icon-btn ${isListening ? 'active' : ''}`} onClick={startListening} disabled={isTyping}>
              <Mic size={18} />
            </button>
            <button type="submit" className="icon-btn" style={{ color: isTyping ? '#555' : 'var(--accent)' }} disabled={isTyping}>
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
