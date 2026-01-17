
import React, { useState, useEffect, useRef } from 'react';
import { Puzzle, SimulationObject, Scenario } from '../types';
import { VisualSimulation } from './VisualSimulation';
import { CodeEditor } from './CodeEditor';
import { getStarterCode, getTestCaseData } from '../services/puzzleData';

interface PuzzleCardProps {
  puzzle: Puzzle | null;
  onSolve: (correct: boolean) => void;
  onNext: () => void;
  isChallengeMode?: boolean;
}

declare global {
  interface Window {
    loadPyodide: any;
  }
}

export const PuzzleCard: React.FC<PuzzleCardProps> = ({ puzzle, onSolve, onNext, isChallengeMode = false }) => {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [currentObjects, setCurrentObjects] = useState<SimulationObject[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isPyLoading, setIsPyLoading] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [testResults, setTestResults] = useState<{name: string, status: 'pass' | 'fail' | 'pending'}[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenarios = puzzle?.scenarios || [];
  const activeScenario = scenarios[activeScenarioIdx];

  useEffect(() => {
    if (scenarios.length > 0) {
      setTestResults(scenarios.map(s => ({ name: s.name, status: 'pending' })));
      setActiveScenarioIdx(0);
      setCurrentObjects(scenarios[0].initialState.objects);
    }
  }, [puzzle]);

  useEffect(() => {
    if (activeScenario && !history.length) {
      setCurrentObjects(activeScenario.initialState.objects);
      setHistory([]);
      setCurrentFrameIdx(0);
      setIsPaused(true);
    }
  }, [activeScenarioIdx, puzzle]);

  useEffect(() => {
    async function init() {
      if (!window.loadPyodide || pyodide) return;
      setIsPyLoading(true);
      try {
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"
        });
        setPyodide(py);
      } catch (e) {
        setLogs(prev => [...prev, "Python Engine offline."]);
      }
      setIsPyLoading(false);
    }
    init();
  }, [pyodide]);

  useEffect(() => {
    if (history.length > 0 && !isPaused && currentFrameIdx < history.length - 1) {
      playbackTimerRef.current = setTimeout(() => {
        setCurrentFrameIdx(prev => prev + 1);
      }, 500);
    }
    return () => { if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current); };
  }, [currentFrameIdx, history, isPaused]);

  useEffect(() => {
    if (history[currentFrameIdx]) {
      const frame = history[currentFrameIdx];
      setCurrentObjects(frame.objects);
      setLogs(frame.logs);
    }
  }, [currentFrameIdx, history]);

  const runLogic = async (userCode: string) => {
    if (!pyodide || !puzzle) return;
    setIsPyLoading(true);
    setLogs(["Preparing Environment..."]);
    
    try {
      const bridgeClass = `
import json
import sys

class VisualProxy:
    _instances = {}
    @classmethod
    def reset(cls): cls._instances = {}
    def __init__(self, val=None):
        self._id = f"obj_{id(self)}"
        self.val = val
        VisualProxy._instances[id(self)] = self

class UniversalBridge:
    def __init__(self):
        self.history = []
        self.pos_cache = {} 
        VisualProxy.reset()
        
    def trace_step(self, line_no, frame):
        locals_map = {k: v for k, v in frame.f_locals.items() if not k.startswith('_') and k != 'Logic'}
        dynamic_objs = []
        connections = []
        
        idx = 0
        for var_name, val in locals_map.items():
            oid = str(id(val))
            x, y = 150 + (idx * 160), 200
            
            if isinstance(val, (int, str, float)):
                dynamic_objs.append({'id': oid, 'type': 'circle', 'label': str(val), 'x': x, 'y': y, 'color': '#1e293b'})
            elif isinstance(val, list):
                w = len(val) * 60
                dynamic_objs.append({'id': oid, 'type': 'rectangle', 'x': x, 'y': y, 'width': w, 'height': 50, 'color': '#0f172a'})
                for i, v in enumerate(val):
                    dynamic_objs.append({'id': f"c_{oid}_{i}", 'type': 'box', 'label': str(v), 'x': x - w/2 + i*60 + 30, 'y': y})
            elif isinstance(val, VisualProxy):
                dynamic_objs.append({'id': oid, 'type': 'circle', 'label': str(val.val or 'Node'), 'x': x, 'y': y, 'color': '#4f46e5'})
                for attr, attr_val in vars(val).items():
                    if not attr.startswith('_') and attr != 'val':
                        tid = str(id(attr_val))
                        connections.append({'id': f"e_{oid}_{attr}", 'type': 'connection', 'sourceId': oid, 'targetId': tid, 'label': attr, 'isDirected': True, 'color': '#6366f1'})
            
            dynamic_objs.append({'id': f"p_{var_name}", 'type': 'path-arrow', 'label': var_name.upper(), 'x': x, 'y': y-80, 'color': '#facc15'})
            idx += 1
            
        self.history.append({'objects': json.loads(json.dumps(connections + dynamic_objs)), 'line': line_no, 'logs': [f"Executing: line {line_no}"]})
`;

      const testCaseSetup = getTestCaseData(puzzle.id, activeScenarioIdx);
      const testRunner = `
${bridgeClass}
Logic = UniversalBridge()
def trace_calls(frame, event, arg):
    if event == 'line' and frame.f_code.co_filename == '<string>':
        Logic.trace_step(frame.f_lineno, frame)
    return trace_calls

# SETUP TEST CASE INPUT
${testCaseSetup}

# EXECUTE USER LOGIC
sys.settrace(trace_calls)
try:
    exec_globals = {"VisualProxy": VisualProxy, "VisualProxy": VisualProxy}
    # Carry over the test case variables to user scope
    exec_globals.update(locals())
    exec("""${userCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}""", exec_globals)
finally:
    sys.settrace(None)
json.dumps({"history": Logic.history})
`;

      const output = await pyodide.runPythonAsync(testRunner);
      const parsed = JSON.parse(output || '{}');
      
      if (parsed.history) {
        setHistory(parsed.history);
        setCurrentFrameIdx(0);
        setIsPaused(false);
        
        if (isChallengeMode) {
          setTestResults(prev => prev.map((t, i) => i === activeScenarioIdx ? {...t, status: 'pass'} : t));
        }
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `Execution Error: ${err.message}`]);
      if (isChallengeMode) {
        setTestResults(prev => prev.map((t, i) => i === activeScenarioIdx ? {...t, status: 'fail'} : t));
      }
    } finally {
      setIsPyLoading(false);
    }
  };

  if (!puzzle) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{puzzle.topic}</span>
                 <span className="text-slate-700">•</span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Test {activeScenarioIdx + 1} of {scenarios.length}</span>
              </div>
              <h3 className="text-2xl font-black text-white">{puzzle.title}</h3>
            </div>
            {isChallengeMode && (
              <div className="flex gap-2">
                {testResults.map((t, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveScenarioIdx(i)}
                    className={`w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-black transition-all ${activeScenarioIdx === i ? 'scale-110 ring-2 ring-indigo-500/50' : 'opacity-40'} ${t.status === 'pass' ? 'bg-emerald-500 text-white' : t.status === 'fail' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {i+1}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="h-[500px] rounded-3xl overflow-hidden bg-slate-950/50 border border-white/5 relative">
             <VisualSimulation 
               puzzle={{...puzzle, initialState: { objects: currentObjects } } as any} 
               onStateChange={() => {}} 
             />
          </div>

          <div className="mt-6 flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
             <button 
                onClick={() => setIsPaused(!isPaused)} 
                disabled={history.length === 0}
                className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white disabled:opacity-20 transition-all shadow-lg shadow-indigo-500/20"
             >
                <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
             </button>
             <div className="flex-1">
                <input 
                  type="range" 
                  min="0" 
                  max={Math.max(0, history.length - 1)} 
                  value={currentFrameIdx} 
                  onChange={(e) => { setIsPaused(true); setCurrentFrameIdx(parseInt(e.target.value)); }}
                  className="w-full accent-indigo-500" 
                />
             </div>
             <div className="text-[10px] font-black text-slate-500 w-12 text-center uppercase tracking-widest">
                {currentFrameIdx + 1}/{history.length || 1}
             </div>
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border border-white/5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Challenge Objective</h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">{puzzle.challengeGoal}</p>
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
               <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Pattern Hint</p>
               <p className="text-slate-400 text-xs italic">{puzzle.explanation}</p>
            </div>
        </div>
      </div>

      <div className="h-[800px] sticky top-24">
        <CodeEditor 
          initialCode={getStarterCode(puzzle.id)} 
          onRun={runLogic} 
          isLoading={isPyLoading}
          logs={logs}
          activeLine={history[currentFrameIdx]?.line}
        />
      </div>
    </div>
  );
};
