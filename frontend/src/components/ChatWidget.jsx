import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import { ArrowRight, User, Mic } from 'lucide-react';

// Subcomponent to render Transaction Draft if detected in bot message
const TransactionDraft = ({ text, onConfirm, onEdit }) => {
  const [draftId] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());

  if (!text.includes("Here is a summary of your expense:")) {
    return <div className="message bot" style={{ whiteSpace: 'pre-wrap' }}>{text}</div>;
  }

  // Parse lines
  const lines = text.split('\n');
  const context = { name: '', mobile: '', email: '', card: '', category: '', amount: '0', date: '', desc: '' };
  lines.forEach(l => {
    if (l.startsWith('- Name:')) context.name = l.replace('- Name:', '').trim();
    if (l.startsWith('- Mobile:')) context.mobile = l.replace('- Mobile:', '').trim();
    if (l.startsWith('- Email:')) context.email = l.replace('- Email:', '').trim();
    if (l.startsWith('- Card:')) context.card = l.replace('- Card:', '').trim();
    if (l.startsWith('- Category:')) context.category = l.replace('- Category:', '').trim();
    if (l.startsWith('- Amount:')) context.amount = l.replace('- Amount: $', '').trim();
    if (l.startsWith('- Date:')) context.date = l.replace('- Date:', '').trim();
    if (l.startsWith('- Description:')) context.desc = l.replace('- Description:', '').trim();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
      <div className="message bot">Understood. Processing entry...</div>

      <div style={{
        borderLeft: '4px solid var(--primary)',
        backgroundColor: 'var(--surface-dim)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.1em' }}>TRANSACTION DRAFT</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>ID: {draftId}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1 }}>{context.amount}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>₹</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>FULL NAME</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{context.name || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>MOBILE</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.05em' }}>{context.mobile || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>EMAIL</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{context.email || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>DATE</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{context.date || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>MERCHANT / DESC</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{context.desc || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>CATEGORY</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{context.category || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>ACCOUNT</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{context.card || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>STATUS</div>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', backgroundColor: 'rgba(255, 231, 146, 0.1)', padding: '0.2rem 0.5rem', display: 'inline-block', borderRadius: '2px', color: 'var(--primary)' }}>
              PENDING CONFIRMATION
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button className="btn-primary" onClick={() => onConfirm('yes')}>CONFIRM ENTRY</button>
          <button className="btn-ghost" onClick={() => onEdit()}>EDIT DETAILS</button>
        </div>
      </div>
    </div>
  );
};

export default function ChatWidget({ onAction, externalCommand, clearExternalCommand }) {
  const [messages, setMessages] = useState([
    { text: "Hello! Which operations do you need to do?\n1. Create Expense\n2. View Expenses\n3. Modify/Delete Expense", isBot: true, showMenu: true }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
      inputRef.current?.focus();
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (externalCommand) {
      handleSend(externalCommand);
      clearExternalCommand();
    }
  }, [externalCommand]);

  const handleSend = async (textOverride) => {
    const userText = typeof textOverride === 'string' ? textOverride : input.trim();
    if (!userText) return;

    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setInput('');

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        sessionId,
        message: userText
      });

      setMessages(prev => {
        const newMsg = { text: res.data.reply, isBot: true };
        if (res.data.reply.includes("Please choose an option")) {
          newMsg.showMenu = true;
        }
        return [...prev, newMsg];
      });

      if (res.data.requiresAction) {
        onAction(res.data.requiresAction);
      }
    } catch (err) {
      setMessages(prev => [...prev, { text: "Network error trying to reach the agent.", isBot: true }]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}>

      <div className="chat-messages" style={{ flex: 1, padding: '2rem 3rem', height: 'auto' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>

            {m.isBot && <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'var(--primary)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-primary)', fontSize: '0.75rem', fontWeight: '800' }}>
                ⬢
              </div>
              <div style={{ flex: 1 }}>
                <TransactionDraft
                  text={m.text}
                  onConfirm={(msg) => handleSend(msg)}
                  onEdit={() => {
                    setMessages(prev => [...prev, { text: "What would you like to edit? (e.g., 'change amount to 50', 'change name to John', 'change date to today')", isBot: true }]);
                    setInput("change ");
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                />
                <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>SYSTEM READY • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
              </div>
            </div>}

            {!m.isBot && <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', alignSelf: 'flex-end', maxWidth: '80%' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--surface-container-highest)', padding: '1rem 1.5rem', letterSpacing: '0.02em', fontSize: '1rem' }}>
                {m.text}
              </div>
              <div style={{ backgroundColor: 'var(--ghost-border)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} color="var(--on-surface-variant)" />
              </div>
            </div>}

            {!m.isBot && <div style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>USER • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>}

          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form at Bottom */}
      <div style={{ padding: '0 3rem 2rem 3rem' }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{
            display: 'flex',
            backgroundColor: 'var(--surface-dim)',
            border: '1px solid var(--ghost-border)',
            padding: '0.5rem',
            alignItems: 'center'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Instruct the agent (e.g., 'Analyze subscriptions')"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ backgroundColor: 'transparent', border: 'none', flex: 1, outline: 'none' }}
          />
          <button 
            type="button" 
            onClick={startListening} 
            style={{ 
              backgroundColor: 'transparent', 
              border: 'none', 
              color: isListening ? 'var(--error)' : 'var(--on-surface-variant)', 
              cursor: 'pointer', 
              padding: '0.5rem',
              animation: isListening ? 'pulse 1.5s infinite' : 'none'
            }}
            title="Use Microphone"
          >
            <Mic size={20} />
          </button>

          <button type="submit" style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem 1rem' }}>
            <ArrowRight size={20} />
          </button>
        </form>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.65rem', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>
          <span>● PRECISION ENGINE ACTIVE</span>
          <span>🛡 END-TO-END SECURE</span>
        </div>
      </div>

    </div>
  );
}
