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
    <div className="faq-view">
      <div className="view-header">
        <h2 className="view-title">SYSTEM_KNOWLEDGE_BASE</h2>
        <p className="view-subtitle">Frequently asked questions and operational documentation.</p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, idx) => (
          <div key={idx} className="faq-item">
            <div className="faq-question">
              <HelpCircle size={16} className="faq-icon" />
              <span>{faq.q}</span>
            </div>
            <div className="faq-answer">
              <ChevronRight size={12} className="answer-arrow" />
              <p>{faq.a}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx="true">{`
        .faq-view {
          padding: 40px;
          height: 100%;
          overflow-y: auto;
          background: #000;
          color: #fff;
        }
        .view-header {
          margin-bottom: 40px;
          border-left: 2px solid #ffcc00;
          padding-left: 20px;
        }
        .view-title {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }
        .view-subtitle {
          font-size: 12px;
          color: #444;
          font-weight: 600;
          letter-spacing: 1px;
        }
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .faq-item {
          background: #050505;
          border: 1px solid #111;
          padding: 24px;
          border-radius: 4px;
        }
        .faq-question {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .faq-icon {
          color: #ffcc00;
        }
        .faq-answer {
          display: flex;
          gap: 10px;
          color: #888;
          font-size: 13px;
          line-height: 1.6;
          padding-left: 28px;
        }
        .answer-arrow {
          margin-top: 4px;
          color: #333;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
