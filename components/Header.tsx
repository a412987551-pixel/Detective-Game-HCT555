import React from 'react';
import { AlertTriangle, Globe } from 'lucide-react';

interface HeaderProps {
  turnsLeft: number;
  location: string;
}

const Header: React.FC<HeaderProps> = ({ turnsLeft, location }) => {
  return (
    <header className="h-14 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
      {/* Left: Game Title / Breadcrumbs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center text-slate-400 text-xs uppercase tracking-widest font-bold gap-2">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]"></span>
            <span>Campus Emergency</span>
        </div>
        <div className="h-4 w-px bg-white/10 mx-2"></div>
        <h1 className="text-slate-200 font-title text-sm md:text-base tracking-wide drop-shadow-md">
          案件檔案：<span className="text-white font-bold ml-1">餐飲三勤命案</span>
          <span className="mx-2 text-slate-600">/</span>
          <span className="text-slate-300">{location || "調查中..."}</span>
        </h1>
      </div>

      {/* Right: Tools & Status */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/10 text-xs text-slate-300 backdrop-blur-sm">
            <Globe className="w-3 h-3" />
            <span>許淑媚 老師</span>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-colors shadow-lg ${
            turnsLeft <= 5 ? 'bg-red-900/80 text-red-200 border border-red-700' : 'bg-red-800/80 text-white border border-red-700'
        }`}>
          <AlertTriangle className="w-3 h-3" />
          {turnsLeft > 0 ? `結案期限: ${turnsLeft} 行動` : '調查失敗'}
        </div>
      </div>
    </header>
  );
};

export default Header;