import { useState, useRef, useReducer } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { TradingComposition } from './remotion/TradingComposition';
import { editorReducer, initialState } from './utils/editorState';
import SidebarProperties from './components/SidebarProperties';
import ChartWrapper from './components/ChartWrapper';
import { Loader2, MousePointer2, Plus, TrendingUp, MessageSquare, Play, Edit3 } from 'lucide-react';
import './index.css';

function App() {
  const [editorState, dispatch] = useReducer(editorReducer, initialState);
  const playerRef = useRef<PlayerRef>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [viewMode, setViewMode] = useState<'design' | 'preview'>('design');
  const COMPOSITION_DURATION = 300;

  const handleRender = async () => {
    try {
      setIsRendering(true);

      // Pause player if playing
      playerRef.current?.pause();

      const response = await fetch('http://localhost:3001/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candles: editorState.candles }),
      });

      if (!response.ok) {
        throw new Error(`Render failed: ${response.statusText}`);
      }

      // The server returns the raw video file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Trigger a download in the browser
      const a = document.createElement('a');
      a.href = url;
      a.download = `Trade_Animator_Custom.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error) {
      console.error("Failed to render video:", error);
      alert("Failed to render video. Make sure the Node server is running on port 3001.");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="editor-layout">
      {/* Top Header */}
      <header className="header-panel">
        <h1 className="text-xl font-bold tracking-wide" style={{ color: 'var(--accent-color)' }}>
          Trade Animator Pro <span className="text-xs text-zinc-500 font-normal ml-2">v2.0</span>
        </h1>
        <div className="flex-1" />
        <button
          onClick={handleRender}
          disabled={isRendering}
          className={`flex items-center gap-2 text-xs px-4 py-2 font-medium rounded transition-colors ${isRendering
            ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
            }`}
        >
          {isRendering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Rendering MP4...
            </>
          ) : (
            "Render High-Quality MP4"
          )}
        </button>
      </header>

      {/* Left: Asset Library */}
      <aside className="library-panel p-4">
        <h2 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">Custom Candles</h2>
        <div className="flex flex-col gap-2 mb-6">
          <button
            onClick={() => {
              // Add a default starting candle
              const lastCandle = editorState.candles[editorState.candles.length - 1];
              const open = lastCandle ? lastCandle.close : 100;
              const close = open + (Math.random() > 0.5 ? 2 : -2);
              const high = Math.max(open, close) + 1;
              const low = Math.min(open, close) - 1;

              dispatch({
                type: 'ADD_CANDLE',
                payload: { open, close, high, low, time: Date.now() }
              });
              // Select the newly added candle
              dispatch({ type: 'SELECT_ELEMENT', payload: `candle-${editorState.candles.length}` });
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm transition-colors shadow-lg"
          >
            + Add New Candle
          </button>
        </div>

        {editorState.candles.length > 0 && (
          <>
            <h2 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">Timeline Items</h2>
            <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto pr-2">
              {editorState.candles.map((candle, idx) => {
                const isSelected = editorState.selectedElementId === `candle-${idx}`;
                const isBull = candle.close >= candle.open;
                return (
                  <button
                    key={idx}
                    onClick={() => dispatch({ type: 'SELECT_ELEMENT', payload: `candle-${idx}` })}
                    className={`text-left px-3 py-2 rounded border text-xs transition-colors flex items-center gap-2 ${isSelected ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-transparent border-white/5 text-zinc-400 hover:bg-white/5'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isBull ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    Candle {idx + 1}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {/* Center: Video Canvas (Remotion Player OR Editor) */}
      <main className="canvas-panel relative">
        {/* Checkered background to denote transparent areas */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px', opacity: 0.5, pointerEvents: 'none' }} />

        {/* View mode toggle */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex bg-black/50 p-1 rounded-full border border-white/10 backdrop-blur-md shadow-2xl">
          <button onClick={() => setViewMode('design')} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'design' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
            <Edit3 className="w-4 h-4" /> Design Mode
          </button>
          <button onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
            <Play className="w-4 h-4" /> Preview Video
          </button>
        </div>

        {/* Toolbar (Only in Design Mode) */}
        {viewMode === 'design' && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 bg-black/60 p-2 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl">
            <button onClick={() => dispatch({ type: 'SET_MODE', payload: 'select' })} className={`p-3 rounded-lg relative transition-colors ${editorState.mode === 'select' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'text-zinc-400 hover:bg-white/10 border-transparent border'} border`} title="Select">
              <MousePointer2 className="w-5 h-5" />
            </button>
            <button onClick={() => dispatch({ type: 'SET_MODE', payload: 'draw_candle' })} className={`p-3 rounded-lg relative transition-colors ${editorState.mode === 'draw_candle' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'text-zinc-400 hover:bg-white/10 border-transparent border'} border`} title="Draw Candle">
              <Plus className="w-5 h-5" />
            </button>
            <button onClick={() => dispatch({ type: 'SET_MODE', payload: 'draw_trendline' })} className={`p-3 rounded-lg relative transition-colors ${editorState.mode === 'draw_trendline' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'text-zinc-400 hover:bg-white/10 border-transparent border'} border`} title="Draw Trendline">
              <TrendingUp className="w-5 h-5" />
            </button>
            <button onClick={() => dispatch({ type: 'SET_MODE', payload: 'add_callout' })} className={`p-3 rounded-lg relative transition-colors ${editorState.mode === 'add_callout' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'text-zinc-400 hover:bg-white/10 border-transparent border'} border`} title="Add Callout">
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* The True 16:9 Output Canvas */}
        <div className="relative shadow-2xl flex items-center justify-center rounded overflow-hidden" style={{ width: '80%', aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.1)' }}>
          {viewMode === 'preview' ? (
            <Player
              ref={playerRef}
              component={TradingComposition}
              inputProps={{
                candles: editorState.candles.length > 0 ? editorState.candles : [{ open: 100, close: 105, high: 110, low: 95 }] // Default fallback candle
              }}
              durationInFrames={COMPOSITION_DURATION}
              fps={60}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: '100%', height: '100%' }}
              controls={true} // Enable native controls for previewing easier
              autoPlay={false} // Disable autoPlay so it doesn't run during setup
              loop={false}    // Disable loop for recording
            />
          ) : (
            <div className="w-full h-full bg-[#09090b] flex items-center justify-center overflow-hidden z-10">
              <div style={{ transform: 'scale(1)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChartWrapper isPlaying={false} state={editorState} dispatch={dispatch} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right: Inspector */}
      <SidebarProperties state={editorState} dispatch={dispatch} />

      {/* Bottom: Timeline */}
      <footer className="timeline-panel relative">
        <div className="flex h-8 bg-black/40 border-b border-white/10 items-center px-4">
          <span className="text-xs text-zinc-400 font-mono">00:00:00:00</span>
          <div className="flex-1" />
          <button
            onClick={() => playerRef.current?.isPlaying() ? playerRef.current?.pause() : playerRef.current?.play()}
            className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 rounded transition-colors mr-2"
          >
            Play / Pause
          </button>
        </div>
        <div className="flex-1 p-4 relative overflow-y-auto">
          <div className="text-sm text-zinc-500 flex items-center justify-center h-full italic">
            Timeline Tracks Implementation Pending...
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
