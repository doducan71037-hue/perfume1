import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Message } from '../types';

export const Consultation: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const startConsultation = () => {
    setHasStarted(true);
    setIsLoading(true);
    setTimeout(() => {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'System initialized. I am ScentAI. Please describe the atmosphere or emotion you wish your fragrance to convey (e.g., minimalist, authoritative, ethereal).',
          timestamp: Date.now()
        }
      ]);
      setIsLoading(false);
    }, 800);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      let aiResponse: Message;
      const msgCount = messages.length;

      if (msgCount < 2) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Noted. How would you characterize your aesthetic? Are there specific accords you strictly avoid?',
          timestamp: Date.now()
        };
      } else if (msgCount < 4) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Processing context. Finally, in what setting will this fragrance primarily be worn?',
          timestamp: Date.now()
        };
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Profile analysis complete. I have generated a curated list of matches.',
          type: 'report_link',
          reportId: '123',
          timestamp: Date.now()
        };
      }

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1200);
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[90vh] px-6 bg-white pt-20">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-8">Consultation</h1>
        <p className="text-gray-500 font-light text-center max-w-md mb-12 leading-relaxed">
          A guided algorithmic process to identify your olfactory signature.
        </p>
        <Button size="lg" onClick={startConsultation}>Initialize</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white pt-20 max-w-3xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-6 py-12">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-12 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] uppercase tracking-widest text-gray-300 mb-2 font-mono">
              {msg.role === 'user' ? 'USER_INPUT' : 'SYSTEM_OUTPUT'}
            </span>
            <div className={`max-w-[90%] md:max-w-lg text-lg md:text-xl font-light leading-relaxed
              ${msg.role === 'user' ? 'text-right text-black' : 'text-left text-gray-600'}`}>
              {msg.content}
              {msg.type === 'report_link' && (
                <div className="mt-8">
                  <Button size="md" onClick={() => navigate(`/report/${msg.reportId}`)}>
                    View Report
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-start fade-in-up">
            <span className="text-[10px] uppercase tracking-widest text-gray-300 mb-2 font-mono">PROCESSING</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-black rounded-none animate-pulse"></div>
              <div className="w-1 h-1 bg-black rounded-none animate-pulse delay-100"></div>
              <div className="w-1 h-1 bg-black rounded-none animate-pulse delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 pb-12 bg-white">
        <form onSubmit={handleSendMessage} className="relative border-b border-gray-200">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your response..."
            className="w-full py-4 bg-transparent text-xl font-light focus:outline-none placeholder:text-gray-200"
            disabled={isLoading || messages.some(m => m.type === 'report_link')}
            autoFocus
          />
          <button 
            type="submit" 
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest font-bold hover:text-gray-500 disabled:opacity-0 transition-all"
            disabled={!inputValue.trim() || isLoading}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};