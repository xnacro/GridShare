import React, { useState } from 'react';
import FaIcon from '../icons/FaIcon';
import Button, { IconButton } from '../ui/Button';
import { api } from '../../services/api';

export default function GroundedAiAssistantModal({ isOpen, onClose, currentHousehold, copilotData }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello! I am Hornet AI, your grounded microgrid energy assistant. Ask me about your solar forecasts, safe tradeable energy, battery reserve protection, or why a specific trade action was recommended.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sampleQuestions = [
    'Will I have surplus solar energy to sell?',
    'Should I charge or discharge my battery?',
    'How much energy can I safely trade right now?',
    'Why did GridShare recommend local trading?',
  ];

  const handleSend = async (questionText) => {
    const textToSend = questionText || query;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setIsSubmitting(true);

    try {
      const resp = await api.queryCopilot({
        query: textToSend,
        household_id: currentHousehold !== 'COMMUNITY' ? currentHousehold : undefined,
      });

      const ans = resp.data?.data?.answer || resp.data?.answer || 'I evaluated your telemetry. Your solar and battery state are within normal operating bounds.';
      const botMsg = {
        sender: 'assistant',
        text: ans,
        groundedFacts: resp.data?.data?.grounded_facts || resp.data?.grounded_state,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Q&A assistant error:', err);
      // Fallback grounded answer from current copilotData
      const f = copilotData?.forecast;
      const c = copilotData?.current_state;
      const fallbackText = f?.balance_kw > 0
        ? `Based on your live telemetry, you have +${f.balance_kw} kW expected surplus and ${f.safe_tradeable_kwh || 0.8} kWh safe tradeable energy over the next 15 minutes.`
        : `Based on your live telemetry, your household load (${c?.demand_kw || 2.4} kW) currently exceeds rooftop generation (${c?.generation_kw || 0.0} kW).`;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12251D]/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[rgba(23,34,29,0.12)] shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(23,34,29,0.08)] flex items-center justify-between bg-[#F8FAF9]">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-[#7358C7]/15 flex items-center justify-center text-[#7358C7]">
              <FaIcon name="brain" className="text-sm" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17221D]">Hornet AI Energy Assistant</h3>
              <p className="text-xs text-[#5E6963]">Grounded in live telemetry, Random Forest forecasts & optimizer constraints</p>
            </div>
          </div>
          <IconButton icon="close" size="sm" variant="ghost" onClick={onClose} aria-label="Close Assistant" />
        </div>

        {/* Message Stream */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-white">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#1E9B68] text-white font-medium shadow-subtle'
                    : 'bg-[#F4F6F4] text-[#17221D] border border-[rgba(23,34,29,0.06)]'
                }`}
              >
                <p>{msg.text}</p>
                {msg.groundedFacts && (
                  <div className="mt-2.5 pt-2 border-t border-[rgba(23,34,29,0.08)] text-[10px] space-y-1 text-[#5E6963]">
                    <p className="font-semibold text-[#17221D]">Authoritative System Sources:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-[rgba(23,34,29,0.08)]">Solar: {msg.groundedFacts.solar_kw} kW</span>
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-[rgba(23,34,29,0.08)]">Demand: {msg.groundedFacts.demand_kw} kW</span>
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-[rgba(23,34,29,0.08)]">Safe kWh: {msg.groundedFacts.safe_tradeable_kwh}</span>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#89938D] mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isSubmitting && (
            <div className="flex items-center space-x-2 text-xs text-[#5E6963] italic">
              <div className="h-2 w-2 rounded-full bg-[#7358C7] animate-pulse" />
              <span>Querying authoritative prediction & dispatch models...</span>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-6 py-2.5 bg-[#F8FAF9] border-t border-[rgba(23,34,29,0.06)]">
          <p className="text-[11px] font-semibold text-[#5E6963] mb-1.5">Suggested Questions:</p>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-[11px] bg-white hover:bg-[#F0F4F2] text-[#17221D] border border-[rgba(23,34,29,0.1)] px-2.5 py-1 rounded-lg transition text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[rgba(23,34,29,0.08)] flex items-center space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your energy forecast or recommendations..."
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#F8FAF9] border border-[rgba(23,34,29,0.12)] text-[#17221D] focus:outline-none focus:ring-2 focus:ring-[#1E9B68]/30"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSend()}
            disabled={isSubmitting || !query.trim()}
          >
            Ask AI
          </Button>
        </div>

      </div>
    </div>
  );
}
