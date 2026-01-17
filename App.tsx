
import React, { useState } from 'react';
import { Puzzle, UserStats } from './types';
import { PuzzleCard } from './components/PuzzleCard';
import { SkillRadar } from './components/SkillRadar';
import { STATIC_PUZZLES } from './services/puzzleData';

type ViewMode = 'dashboard' | 'visualize' | 'challenges';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  
  const [stats, setStats] = useState<UserStats>({
    intuitionScore: 1250,
    streak: 7,
    weaknesses: { 
      'Two Pointers': 85, 
      'Sliding Window': 40, 
      'Linked Lists': 65, 
      'Graphs': 20, 
      'Trees': 30,
      'Stack': 90
    }
  });

  const patterns = Object.keys(STATIC_PUZZLES);

  const startPuzzle = (p: Puzzle, mode: ViewMode) => {
    setLoading(true);
    setTimeout(() => {
      setPuzzle(p);
      setViewMode(mode);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-8 font-black text-white tracking-widest uppercase text-sm">Synchronizing Modules...</p>
        </div>
      )}

      <nav className="p-6 flex justify-between items-center border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setViewMode('dashboard'); setPuzzle(null); }}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
            <i className="fas fa-brain text-white"></i>
          </div>
          <h1 className="text-xl font-black tracking-tighter">Logic<span className="text-indigo-500">Play.</span></h1>
        </div>
        
        <div className="flex gap-8">
           <button onClick={() => { setViewMode('dashboard'); setPuzzle(null); }} className={`text-[10px] font-black uppercase tracking-widest ${viewMode === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'}`}>Dashboard</button>
           <button onClick={() => startPuzzle(STATIC_PUZZLES['Two Pointers'][0], 'visualize')} className={`text-[10px] font-black uppercase tracking-widest ${viewMode === 'visualize' ? 'text-indigo-400' : 'text-slate-500'}`}>Trace Engine</button>
           <button onClick={() => startPuzzle(STATIC_PUZZLES['Two Pointers'][0], 'challenges')} className={`text-[10px] font-black uppercase tracking-widest ${viewMode === 'challenges' ? 'text-indigo-400' : 'text-slate-500'}`}>Game Arena</button>
        </div>

        <div className="flex gap-4 items-center">
          <div className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 font-black text-sm">
            {stats.intuitionScore} XP
          </div>
        </div>
      </nav>

      <main className="px-6 py-12 max-w-[1400px] mx-auto">
        {viewMode === 'dashboard' ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-white">Logic Curriculum</h2>
                <p className="text-slate-500 text-sm">Select a pattern and choose your interaction mode.</p>
              </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-6">
              {patterns.map(patternName => (
                <div key={patternName} className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col hover:border-indigo-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <i className={`fas ${patternName === 'Two Pointers' ? 'fa-arrows-left-right' : patternName === 'Sliding Window' ? 'fa-window-maximize' : 'fa-link'}`}></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">{patternName}</h3>
                  
                  <div className="space-y-3 mt-6">
                    <button 
                      onClick={() => startPuzzle(STATIC_PUZZLES[patternName][0], 'challenges')}
                      className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-gamepad"></i> Game Challenge
                    </button>
                    <button 
                      onClick={() => startPuzzle(STATIC_PUZZLES[patternName][0], 'visualize')}
                      className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-eye"></i> Visualizer Mode
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass p-10 rounded-[3rem] border border-white/5">
              <SkillRadar data={stats.weaknesses} />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {puzzle && (
              <PuzzleCard 
                puzzle={puzzle} 
                onSolve={() => {}} 
                onNext={() => {}}
                isChallengeMode={viewMode === 'challenges'}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
