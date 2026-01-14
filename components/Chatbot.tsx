import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';
import { chatWithGemini } from '../services/geminiService';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hi! I'm here to help with your project. Ask about features, timelines, or pricing." }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Open automatically on first visit
    const seen = typeof window !== 'undefined' ? window.localStorage.getItem('chatbot_seen') : '1';
    if (!seen) {
      setIsOpen(true);
      try { window.localStorage.setItem('chatbot_seen', '1'); } catch {}
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);
    try {
      const reply = await chatWithGemini(nextMessages);
      setMessages(prev => [...prev, { role: 'model', content: reply }]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Something went wrong.';
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999]"
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}
    >
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-secondary text-white rounded-full w-14 h-14 shadow-lg hover:bg-green-600 transition flex items-center justify-center"
          style={{ width: 56, height: 56, borderRadius: 9999, background: '#10B981', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)' }}
          aria-label="Open chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.75h6.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 bg-surface border border-border rounded-xl shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-text-primary font-semibold">Project Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-text-primary">×</button>
          </div>

          <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-96 bg-background/60">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user' ? 'bg-primary text-white' : 'bg-surface text-text-primary'} px-3 py-2 rounded-lg max-w-[85%] whitespace-pre-wrap`}>{m.content}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-border bg-surface">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={sendMessage}
                disabled={isSending}
                className="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-hover disabled:bg-gray-600"
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-text-secondary">Powered by Gemini. Don’t share sensitive info.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;


