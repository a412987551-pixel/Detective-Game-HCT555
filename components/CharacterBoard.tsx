import React from 'react';
import { Character } from '../types';

interface CharacterBoardProps {
  characters: Character[];
}

// Strict mapping for specific characters to ensure no duplicates and correct demographics
const NAME_TO_AVATAR: Record<string, string> = {
  "許淑媚": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
  "壽司": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  "戴沂臻": "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop",
  "王洧邦": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
  "許晉嘉": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  "張瑞麟": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop",
  "林主安": "https://images.unsplash.com/photo-1508341591423-4347099e1f19?q=80&w=200&auto=format&fit=crop",
  "小小": "https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=200&auto=format&fit=crop",
};

const FALLBACK_MAP: Record<string, string> = {
  'man': 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=200&auto=format&fit=crop', 
  'woman': 'https://images.unsplash.com/photo-1623039595733-5f46946820cb?q=80&w=200&auto=format&fit=crop', 
  'old': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop', 
  'young': 'https://images.unsplash.com/photo-1628890917027-005e18604f55?q=80&w=200&auto=format&fit=crop',
  'singer': 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop',
};

const CharacterBoard: React.FC<CharacterBoardProps> = ({ characters }) => {
  if (!characters || characters.length === 0) return null;

  const getAvatar = (char: Character) => {
    if (NAME_TO_AVATAR[char.name]) {
      return NAME_TO_AVATAR[char.name];
    }
    const foundKey = Object.keys(NAME_TO_AVATAR).find(key => char.name.includes(key));
    if (foundKey) {
      return NAME_TO_AVATAR[foundKey];
    }
    return FALLBACK_MAP[char.avatar_keyword] || FALLBACK_MAP['man'];
  }

  return (
    // Glass effect background
    <div className="flex justify-center items-start gap-4 md:gap-8 py-6 px-4 overflow-x-auto no-scrollbar bg-black/40 backdrop-blur-sm border-b border-white/5">
      {characters.map((char) => (
        <div key={char.id} className="flex flex-col items-center min-w-[80px] group">
          <div className="relative">
            {/* Status Badge */}
            {char.status === 'deceased' && (
              <span className="absolute -top-2 -right-2 bg-red-950/90 text-red-200 text-[10px] border border-red-800 px-1.5 py-0.5 z-10 font-bold shadow-md">
                死者
              </span>
            )}
             {char.is_interrogating && (
              <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600/90 text-white text-[10px] px-2 py-0.5 rounded-full z-10 font-bold shadow-lg shadow-blue-900/50 animate-bounce whitespace-nowrap">
                詢問中
              </span>
            )}

            {/* Avatar Circle */}
            <div 
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all duration-300 relative shadow-lg
                ${char.status === 'deceased' ? 'grayscale brightness-50 border-red-900' : ''}
                ${char.is_interrogating ? 'border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-110' : 'border-white/20 group-hover:border-white/50'}
              `}
            >
              <img 
                src={getAvatar(char)} 
                alt={char.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:4px_4px] pointer-events-none opacity-20"></div>
            </div>
          </div>

          {/* Text Info - Enhanced text shadow for better visibility over background */}
          <div className="mt-3 text-center drop-shadow-md">
            <div className={`text-sm font-bold tracking-wider ${char.is_interrogating ? 'text-blue-300' : 'text-slate-200'}`}>
              {char.name}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 truncate max-w-[90px]">
              {char.role}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CharacterBoard;