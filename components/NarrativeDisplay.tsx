import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { Terminal } from 'lucide-react';

interface NarrativeDisplayProps {
  messages: Message[];
  isTyping: boolean;
}

const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({ messages, isTyping }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Formatter for highlighting text
  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={index} className="text-red-400 font-bold mx-0.5 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]">{part.slice(2, -2)}</span>;
      }
      if (part.includes('「') || part.includes('」') || part.includes('"')) {
         return <span key={index} className="text-blue-200">{part}</span>;
      }
      return part;
    });
  };

  return (
    // Background transparent to show the classroom
    <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-transparent" ref={scrollRef}>
      <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8">
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4 animate-pulse bg-black/40 p-8 rounded-2xl backdrop-blur-sm">
            <Terminal className="w-8 h-8" />
            <p className="text-sm tracking-[0.2em] uppercase">System Initializing...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="fade-in group">
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                 <div className="bg-slate-800/80 backdrop-blur-sm text-slate-200 px-5 py-3 rounded-2xl rounded-tr-sm border border-slate-600/50 text-base shadow-lg max-w-[85%]">
                    <span className="text-slate-400 text-xs block mb-1 uppercase font-bold tracking-wider">許老師</span>
                    {msg.text}
                 </div>
              </div>
            ) : (
              // GM Message Container
              <div className="relative pl-6 border-l-2 border-red-900/50 group-hover:border-red-600 transition-colors">
                {/* Decorative dot */}
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-red-900 group-hover:bg-red-600 transition-colors shadow-[0_0_5px_red]"></div>
                
                {/* Add a semi-transparent backing for readability on complex backgrounds */}
                <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed text-lg font-body p-4 rounded-lg bg-black/40 backdrop-blur-[2px] shadow-inner">
                  {formatText(msg.text)}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="pl-6 border-l-2 border-slate-700">
             <div className="flex items-center gap-2 text-slate-400 text-sm bg-black/30 p-2 rounded w-fit">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                分析現場中...
             </div>
          </div>
        )}
        
        {/* Spacer for bottom panel */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default NarrativeDisplay;