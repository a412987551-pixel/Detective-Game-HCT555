import React from 'react';
import { Trophy, Skull } from 'lucide-react';

interface GameOverModalProps {
  status: 'won' | 'lost';
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ status, onRestart }) => {
  const isWon = status === 'won';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm fade-in p-4">
      <div className="bg-slate-900 border-2 border-amber-700/50 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl shadow-amber-900/20 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-4 ${isWon ? 'bg-amber-900/30 border-amber-500' : 'bg-slate-800 border-slate-600'}`}>
            {isWon ? (
              <Trophy className="w-10 h-10 text-amber-500" />
            ) : (
              <Skull className="w-10 h-10 text-slate-400" />
            )}
          </div>

          <h2 className="text-3xl font-title font-bold text-white mb-2">
            {isWon ? 'Mystery Solved!' : 'Case Cold'}
          </h2>
          
          <p className="text-slate-300 font-body text-lg mb-8 leading-relaxed">
            {isWon 
              ? "Brilliant deduction, Holmes! The killer has been apprehended and justice served."
              : "The trail has gone cold. The killer escaped into the foggy London night."}
          </p>

          <button
            onClick={onRestart}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg active:scale-95"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;