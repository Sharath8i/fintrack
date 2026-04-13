import React, { useState } from 'react';
import { Search, Bot, PieChart, Clock, Shield, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react';

const FAQ_DATA = [
  // AI Assistant Rules
  { category: 'AI Assistant', icon: <Bot size={18} />, q: "How do I add an expense using chat?", a: "Just type naturally! For example: \"Spent 500 on food today\" or \"Bought shoes for 2000\"." },
  { category: 'AI Assistant', icon: <Bot size={18} />, q: "Can I add multiple expenses in one sentence?", a: "Yes! You can say \"Spent 200 on snacks and 500 on auto\" and the AI will split them into separate ledger entries automatically." },

  // Editing & Rules
  { category: 'Rules & Edits', icon: <Shield size={18} />, q: "How do I edit an expense before saving?", a: "When the AI generates a 'Transaction Draft', you can click the 'AMEND' button or simply chat \"change amount to 600\" before confirming." },
  { category: 'Rules & Edits', icon: <Shield size={18} />, q: "What details are required to save an expense?", a: "The AI needs to detect an Amount. If Category or Description is missing, it will ask you or classify them automatically." },
  { category: 'Rules & Edits', icon: <Shield size={18} />, q: "Why is my input rejected?", a: "Inputs are rejected if they lack numerical values, or if you input negative/zero amounts (e.g. \"Spent -500\")." },

  // Analytics
  { category: 'Analytics', icon: <PieChart size={18} />, q: "What insights can I see in analytics?", a: "You can view your Total Monthly Spend, Growth Trends (increase/decrease percentages), and beautiful visual breakdowns across categories." },
  { category: 'Analytics', icon: <PieChart size={18} />, q: "How is my spending calculated?", a: "The Analytics engine securely aggregates all confirmed ledger entries for the current calendar month to determine averages and highest spends." },

  // History & Export
  { category: 'History & Export', icon: <Clock size={18} />, q: "Can I view past transactions?", a: "Yes! Open the LEDGER_HISTORY tab to see a fully searchable, sortable list of all your archived expenses." },
  { category: 'History & Export', icon: <Clock size={18} />, q: "How do I download my expense report?", a: "Go to LEDGER_HISTORY and click the solid yellow 'EXPORT_RECORDS' button to download a structured Excel-ready CSV." },
];

export default function FAQView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  const filteredFAQs = FAQ_DATA.filter(faq =>
    faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAskBot = (question) => {
    sessionStorage.setItem('pendingFAQPrompt', question);
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
  };

  return (
    <div className="faq-container" style={{ padding: '2rem 0', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', margin: 0, color: '#fff' }}>KNOWLEDGE_PORTAL</h2>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.15em', marginTop: '0.5rem' }}>INTERACTIVE_OPERATIONAL_SUPPORT</div>
      </header>

      {/* --- 2. Search Bar --- */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '0 1rem', marginBottom: '3rem', width: '100%', maxWidth: '600px' }}>
        <Search size={16} color="#666" />
        <input
          type="text"
          placeholder="Search for answers or capabilities..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setOpenIndex(null); }}
          style={{ background: 'transparent', border: 'none', color: '#fff', padding: '1rem', width: '100%', outline: 'none', fontSize: '0.9rem' }}
        />
      </div>

      {/* --- 7. Empty State --- */}
      {filteredFAQs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>No answers found</h3>
          <p style={{ fontSize: '0.9rem' }}>The portal couldn't map an answer. Try asking the AI Assistant directly!</p>
        </div>
      )}

      {/* --- 1. & 3. Grouped Accordion Grid --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', paddingBottom: '3rem' }}>
        {filteredFAQs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} style={{
              background: isOpen ? 'var(--bg-active)' : 'var(--bg-elevated)',
              border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--glass-border)'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <div
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                style={{
                  display: 'flex', gap: '1rem', padding: '1.5rem', cursor: 'pointer', alignItems: 'flex-start',
                }}
              >
                <div style={{ color: isOpen ? 'var(--accent)' : 'var(--text-muted)', paddingTop: '2px' }}>
                  {faq.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    {faq.category}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: isOpen ? '#fff' : '#ccc', lineHeight: 1.4 }}>
                    {faq.q}
                  </div>
                </div>
                <div style={{ color: 'var(--text-dim)' }}>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* --- 5. Hover & Expand content --- */}
              {isOpen && (
                <div style={{ padding: '0 1.5rem 1.5rem 3.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {faq.a}
                  </p>
                  {/* --- 8. CTA to send to bot --- */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAskBot(faq.q); }}
                    style={{
                      background: 'rgba(255, 204, 0, 0.1)',
                      border: '1px solid rgba(255, 204, 0, 0.3)',
                      color: 'var(--accent)',
                      padding: '0.6rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#000'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 204, 0, 0.1)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  >
                    <Send size={12} /> ASK AI THIS QUESTION
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- CTA BOTTOM --- */}
      <div style={{ background: '#0a0a0a', border: '1px solid var(--glass-border)', borderLeft: '4px solid var(--accent)', padding: '2rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={18} color="var(--accent)" /> Still have questions?
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)' }}>Skip the documentation and ask the AI Assistant directly.</p>
        </div>
        <button
          onClick={() => handleAskBot("Hello, what can you do?")}
          style={{
            background: 'var(--accent)', color: '#000', border: 'none', padding: '0.85rem 1.5rem', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', borderRadius: '4px', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255, 204, 0, 0.2)'
          }}
        >
          LAUNCH ASSISTANT
        </button>
      </div>

    </div>
  );
}
