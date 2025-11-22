import React, { useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';

interface ActionPanelProps {
  onAction: (action: string) => void;
  suggestions: string[];
  isLoading: boolean;
  gameStatus: string;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ onAction, suggestions, isLoading, gameStatus }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && gameStatus === 'playing') {
      onAction(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading && gameStatus === 'playing') {
      onAction(suggestion);
    }
  };

  const isGameOver = gameStatus !== 'playing';

  return (
    // High blur glassmorphism for bottom panel
    <div className="bg-black/60 backdrop-blur-md border-t border-white/10 p-4 md:p-6 shrink-0 z-20">
      <div className="max-w-3xl mx-auto w-full">
        
        {/* Quick Actions / Suggestions */}
        {!isGameOver && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="text-xs md:text-sm px-4 py-2 bg-slate-800/60 hover:bg-red-900/40 text-slate-300 hover:text-white border border-slate-600/50 hover:border-red-500/50 rounded-lg transition-all duration-200 flex items-center gap-2 group backdrop-blur-sm shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-red-500 transition-colors"></span>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-3 items-end">
           <div className="hidden md:flex w-10 h-10 rounded-full bg-purple-900/30 border border-purple-500/30 items-center justify-center shrink-0 backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-purple-400" />
           </div>

           <form onSubmit={handleSubmit} className="flex-1 relative">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isGameOver ? "案件已結束" : "輸入行動指令..."}
                    disabled={isLoading || isGameOver}
                    className="w-full bg-slate-900/50 backdrop-blur-sm text-slate-100 placeholder-slate-500 border border-slate-600/50 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-xl py-3.5 pl-4 pr-24 text-base shadow-inner transition-colors"
                />
                
                <div className="absolute right-2 flex items-center gap-1">
                    <button type="button" className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
                        <Mic className="w-5 h-5" />
                    </button>
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading || isGameOver}
                        className="bg-slate-700/80 hover:bg-slate-600 text-slate-200 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                    >
                        提問
                    </button>
                </div>
            </div>
           </form>
        </div>
      </div>
    </div>
  );
};

export default ActionPanel;