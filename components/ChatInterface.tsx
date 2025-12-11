import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { getGeminiExplanation } from '../services/geminiService';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Olá! Sou seu assistente de estúdio. Pergunte-me por que o LA-2A é chamado de compressor de 'Limiar Fixo'." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await getGeminiExplanation(input);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[400px] bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-xl">
      <div className="bg-slate-900 p-3 border-b border-slate-700 flex items-center gap-2">
        <Bot className="w-5 h-5 text-teal-400" />
        <span className="font-semibold text-slate-200">Assistente de Estúdio IA</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-50 text-xs">
                 {m.role === 'user' ? <User size={12}/> : <Bot size={12}/>}
                 {m.role === 'user' ? 'Você' : 'Especialista'}
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
            <div className="flex justify-start">
                <div className="bg-slate-700 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    <span className="text-xs text-slate-400">Analisando sinal...</span>
                </div>
            </div>
        )}
      </div>

      <div className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Pergunte sobre Peak Reduction..."
          className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};