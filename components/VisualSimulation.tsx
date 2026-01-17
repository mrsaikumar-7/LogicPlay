
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Puzzle, SimulationObject } from '../types';

interface GameBoardProps {
  puzzle: Puzzle;
  onStateChange: (currentObjects: SimulationObject[]) => void;
}

export const VisualSimulation: React.FC<GameBoardProps> = ({ puzzle, onStateChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Persistent state for interpolation
  const persistentObjectsRef = useRef<Map<string, SimulationObject>>(new Map());
  const requestRef = useRef<number>(null);

  // Sync incoming puzzle objects to persistent map
  useEffect(() => {
    const incoming = (puzzle as any).initialState?.objects || [];
    
    // We update the target positions in our persistent map
    // but don't snap the current x/y immediately to allow for lerping.
    const newMap = new Map<string, SimulationObject>();
    incoming.forEach((obj: SimulationObject) => {
      const existing = persistentObjectsRef.current.get(obj.id);
      if (existing) {
        // Update targets, keep current visual position for smoothing
        newMap.set(obj.id, {
          ...obj,
          x: existing.x, 
          y: existing.y,
          // We store target coordinates in custom properties for the lerp step
          targetX: obj.x,
          targetY: obj.y
        } as any);
      } else {
        // New object: spawn at position or slightly offset
        newMap.set(obj.id, { ...obj, targetX: obj.x, targetY: obj.y } as any);
      }
    });
    persistentObjectsRef.current = newMap;
  }, [puzzle]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;
    const LERP_SPEED = 0.15; // Smoothness factor

    // Update positions
    persistentObjectsRef.current.forEach((obj: any) => {
      if (obj.targetX !== undefined) obj.x = lerp(obj.x, obj.targetX, LERP_SPEED);
      if (obj.targetY !== undefined) obj.y = lerp(obj.y, obj.targetY, LERP_SPEED);
    });

    const { width, height } = canvas;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);
    
    // Subtle background grid
    ctx.strokeStyle = '#ffffff03';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    const objectsArray = Array.from(persistentObjectsRef.current.values());

    // 1. Render Connections (Edges/Links)
    objectsArray.filter(o => o.type === 'connection').forEach(conn => {
      const source = persistentObjectsRef.current.get(conn.sourceId || '');
      const target = persistentObjectsRef.current.get(conn.targetId || '');
      if (source && target) {
        ctx.strokeStyle = conn.color || '#334155';
        ctx.globalAlpha = conn.opacity || 0.4;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        
        if (conn.isDirected) {
          const headlen = 10;
          const angle = Math.atan2(target.y - source.y, target.x - source.x);
          ctx.beginPath();
          ctx.moveTo(target.x, target.y);
          ctx.lineTo(target.x - headlen * Math.cos(angle - Math.PI / 6), target.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(target.x - headlen * Math.cos(angle + Math.PI / 6), target.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = conn.color || '#334155';
          ctx.fill();
        }
      }
    });

    // 2. Render Physical Objects
    objectsArray.filter(o => o.type !== 'connection').forEach(obj => {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      
      if (obj.type === 'rectangle') {
        ctx.fillStyle = obj.color || '#0f172a';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        const w = obj.width || 120, h = obj.height || 40;
        ctx.beginPath();
        ctx.roundRect(-w/2, -h/2, w, h, 10);
        ctx.fill(); ctx.stroke();
      } else if (obj.type === 'box') {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        const w = obj.width || 50, h = obj.height || 35;
        ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px "JetBrains Mono"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(obj.label || '', 0, 0);
      } else if (obj.type === 'path-arrow') {
        ctx.fillStyle = obj.color || '#facc15';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -12); ctx.lineTo(8, -12); ctx.closePath(); ctx.fill();
        ctx.font = 'bold 9px "JetBrains Mono"';
        const m = ctx.measureText(obj.label);
        const bw = m.width + 12, bh = 18;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = obj.color || '#facc15';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(-bw/2, -12-bh, bw, bh, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(obj.label, 0, -12 - bh/2);
      } else if (obj.type === 'circle' || obj.type === 'node') {
        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
        grad.addColorStop(0, obj.color || '#4f46e5');
        grad.addColorStop(1, '#312e81');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px "Inter"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(obj.label || '', 0, 0);
      }
      ctx.restore();
    });

    ctx.restore();
    requestRef.current = requestAnimationFrame(animate);
  }, [offset, zoom]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative rounded-[2.2rem] overflow-hidden border border-white/10 bg-slate-950 h-full flex flex-col">
      <div className="absolute top-4 left-4 z-20 flex bg-slate-900/90 p-1 rounded-xl border border-white/10 shadow-xl pointer-events-none">
        <div className="px-4 py-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
          Smooth Interpolation Active
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="w-10 h-10 bg-slate-900/90 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all"><i className="fas fa-plus text-xs"></i></button>
        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="w-10 h-10 bg-slate-900/90 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all"><i className="fas fa-minus text-xs"></i></button>
        <button onClick={() => { setZoom(1); setOffset({x:0, y:0}); }} className="w-10 h-10 bg-slate-900/90 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all"><i className="fas fa-expand text-xs"></i></button>
      </div>
      
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={500} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={() => setIsPanning(false)} 
        onMouseLeave={() => setIsPanning(false)}
        className="w-full h-full block cursor-grab active:cursor-grabbing" 
      />
    </div>
  );
};
