import React from 'react';
import { Evidence } from '../types';
import { FileText, MapPin, Gavel, Search, Package } from 'lucide-react';

interface EvidenceSidebarProps {
  evidence: Evidence[];
}

const EvidenceSidebar: React.FC<EvidenceSidebarProps> = ({ evidence }) => {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'place': return <MapPin className="w-4 h-4 text-green-400" />;
      case 'weapon': return <Gavel className="w-4 h-4 text-red-400" />;
      case 'item': default: return <Package className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    // Glassmorphism sidebar
    <div className="w-full md:w-80 bg-black/60 backdrop-blur-md border-r border-white/10 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-black/20">
        <Search className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-bold text-blue-100 tracking-widest uppercase">物證清單 EVIDENCE</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {evidence.length === 0 ? (
          <div className="text-center py-10 px-4">
             <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-3 bg-white/5">
                <Search className="w-6 h-6 text-slate-500" />
             </div>
             <p className="text-slate-500 text-xs">目前尚未發現任何關鍵證物。</p>
          </div>
        ) : (
          evidence.map((item) => (
            <div key={item.id} className="bg-slate-900/60 border border-white/5 hover:border-white/20 rounded p-3 transition-all group backdrop-blur-sm shadow-sm">
              <div className="flex items-start gap-3 mb-2">
                <div className="mt-0.5 shrink-0">{getIcon(item.icon_type)}</div>
                <h3 className="text-slate-200 font-bold text-sm group-hover:text-blue-300 transition-colors">{item.name}</h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed pl-7">
                {item.description}
              </p>
              <div className="mt-3 flex justify-end">
                <button className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors">
                  點擊查看詳情 &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EvidenceSidebar;