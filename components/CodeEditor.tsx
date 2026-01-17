
import React, { useState, useEffect, useRef } from 'react';

interface CodeEditorProps {
  initialCode: string;
  onRun: (code: string) => void;
  isLoading: boolean;
  logs: string[];
  activeLine?: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ initialCode, onRun, isLoading, logs, activeLine }) => {
  const [code, setCode] = useState(initialCode);
  const [showDocs, setShowDocs] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const lines = code.split('\n');

  // Sync scroll between textarea and line numbers
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const gutter = document.getElementById('code-gutter');
    if (gutter) {
      gutter.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
      <div className="p-5 bg-slate-950/80 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500 opacity-50"></div>
            <div className="w-2 h-2 rounded-full bg-amber-500 opacity-50"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-50"></div>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Trace-Enabled IDE v7</span>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowDocs(!showDocs)} 
            className={`p-2 rounded-lg transition-all ${showDocs ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
          >
            <i className="fas fa-terminal"></i>
          </button>
          <button 
            onClick={() => onRun(code)}
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95"
          >
            {isLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-play-circle"></i>}
            START TRACE
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden relative bg-slate-950/20">
        {/* Line Numbers Gutter */}
        <div 
          id="code-gutter"
          className="w-12 bg-slate-950/50 border-r border-white/5 flex flex-col py-6 select-none overflow-hidden"
        >
          {lines.map((_, i) => (
            <div 
              key={i} 
              className={`h-6 flex items-center justify-center text-[10px] font-mono transition-all duration-200 ${activeLine === i + 1 ? 'text-indigo-400 font-bold bg-indigo-500/20 shadow-[inset_2px_0_0_#6366f1]' : 'text-slate-600'}`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Background Highlighting Layer */}
          <div className="absolute inset-0 pointer-events-none py-6">
            {activeLine !== undefined && activeLine > 0 && (
              <div 
                className="absolute left-0 right-0 h-6 bg-indigo-500/10 border-y border-indigo-500/20 transition-all duration-150 ease-out"
                style={{ transform: `translateY(${(activeLine - 1) * 24}px)` }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[4px_0_15px_rgba(99,102,241,0.4)]"></div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <i className="fas fa-caret-left text-indigo-500 animate-pulse"></i>
                </div>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            className="absolute inset-0 w-full h-full bg-transparent p-6 py-6 font-mono text-sm text-indigo-100/80 resize-none outline-none leading-6 whitespace-pre overflow-auto scroll-smooth custom-scrollbar"
          />
        </div>

        {showDocs && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-xl p-10 overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-white font-black text-lg mb-8 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-3">
              <i className="fas fa-info-circle text-indigo-500"></i> Simulation Engine
            </h3>
            <div className="space-y-6 font-mono text-xs">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="text-indigo-400 mb-2 font-black">Native Objects</h4>
                <p className="text-slate-400 leading-relaxed">Standard Python <code className="text-indigo-300">ListNode</code> and <code className="text-indigo-300">TreeNode</code> classes are instrumented for visual output.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="text-indigo-400 mb-2 font-black">Variable Tracking</h4>
                <p className="text-slate-400 leading-relaxed">Local pointers like <code className="text-indigo-300">curr</code>, <code className="text-indigo-300">prev</code>, and <code className="text-indigo-300">nxt</code> are captured per-line.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="text-indigo-400 mb-2 font-black">Line-Level State</h4>
                <p className="text-slate-400 leading-relaxed">Every time the processor moves, a new state frame is captured and rendered.</p>
              </div>
            </div>
            <button onClick={() => setShowDocs(false)} className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all w-full">CLOSE CONSOLE</button>
          </div>
        )}
      </div>

      <div className="h-44 bg-black/80 p-5 overflow-y-auto font-mono text-[10px] border-t border-white/5">
        <div className="flex items-center gap-2 mb-3 text-slate-500 opacity-50">
          <i className="fas fa-terminal"></i>
          <span className="uppercase tracking-widest font-black">Live Processor Log</span>
        </div>
        {logs.length === 0 && <div className="text-slate-800 italic">No execution trace currently active.</div>}
        {logs.map((log, i) => (
          <div key={i} className={`py-1 flex items-start gap-4 transition-all ${i === logs.length - 1 ? 'text-indigo-300 scale-105 origin-left' : 'text-slate-500'}`}>
            <span className="text-slate-700 w-8">STEP_{i+1}</span>
            <span className="flex-1">{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
