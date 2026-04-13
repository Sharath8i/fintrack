import React from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';

export default function FAQView() {
  const faqs = [
    {
      q: "How does the AI Assistant log my expenses?",
      a: "The assistant uses advanced Natural Language Processing. Simply tell it what you spent, and it will generate a 'Transaction Draft' card for your final review before saving."
    },
    {
      q: "Can I edit an entry before saving it?",
      a: "Yes! When you see the 'Transaction Draft' card, you can click 'EDIT DETAILS' to refine the description or amount before it enters your ledger."
    },
    {
      q: "How do I download my financial reports?",
      a: "Navigate to the 'LEDGER_HISTORY' tab and click the 'EXPORT_TO_EXCEL' button. This generates a clean, structured CSV report compatible with Excel and Google Sheets."
    },
    {
      q: "What are the core analytics features?",
      a: "The 'DATA_INSIGHTS' view provides a Monthly Expense Trend bar chart with automatic totals, and category-wise Doughnut charts for granular spending analysis."
    },
    {
      q: "Are the profile validation rules strict?",
      a: "Yes. To ensure accurate reporting, we require a Full Name (First & Last), a Country Code with a 10-digit Mobile Number, and a valid Email Address."
    },
    {
      q: "Does the system support budget alerts?",
      a: "Absolutely. You can set category-specific thresholds. The AI Assistant will instantly notify you in the chat if you exceed your monthly budget for Transport, Shopping, or Food."
    }
  ];

  return (
    <div className="faq-container" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2.5px', margin: 0, color: '#fff' }}>KNOWLEDGE_PORTAL</h2>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.15em', marginTop: '0.5rem' }}>OPERATIONAL_DOCUMENTATION_V2.5</div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem', paddingBottom: '4rem' }}>
        {faqs.map((faq, idx) => (
          <div key={idx} className="precision-panel" style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--glass-border)',
            padding: '2.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              fontSize: '4rem',
              fontWeight: '900',
              color: 'rgba(255,255,255,0.02)',
              userSelect: 'none'
            }}>
              {idx + 1}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{
                padding: '0.75rem',
                background: 'var(--bg-active)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--accent)'
              }}>
                <HelpCircle size={20} />
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.2px', lineHeight: 1.3 }}>
                {faq.q}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', paddingLeft: '0.5rem' }}>
              <div style={{ paddingTop: '0.4rem' }}>
                <ChevronRight size={16} style={{ color: 'var(--accent)', opacity: 0.5 }} />
              </div>
              <p style={{
                margin: 0,
                fontSize: '0.95rem',
                color: 'var(--text-dim)',
                lineHeight: 1.7,
                fontWeight: '400'
              }}>
                {faq.a}
              </p>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
}
