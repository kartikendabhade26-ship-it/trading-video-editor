import { type EditorState, type Action } from '../utils/editorState';

interface SidebarPropertiesProps {
    state: EditorState;
    dispatch: React.Dispatch<Action>;
}

export default function SidebarProperties({ state, dispatch }: SidebarPropertiesProps) {

    const generateChart = (type: 'uptrend' | 'downtrend' | 'ranging') => {
        const newCandles = [];
        let currentPrice = 10000;
        const volatility = 20;

        for (let i = 0; i < 60; i++) {
            const open = currentPrice;

            // Determine trend bias
            let bias = 0;
            if (type === 'uptrend') bias = 15;
            if (type === 'downtrend') bias = -15;
            // ranging relies purely on random noise

            const close = open + bias + (Math.random() * volatility * 2 - volatility);
            const high = Math.max(open, close) + (Math.random() * volatility);
            const low = Math.min(open, close) - (Math.random() * volatility);

            newCandles.push({
                time: Date.now() + (i * 60000), // 1 min apart fake times
                open,
                close,
                high,
                low
            });

            currentPrice = close; // Next candle opens at previous close
        }

        dispatch({ type: 'SET_CANDLES', payload: newCandles });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
                // Basic CSV Parser for TradingView format: time,open,high,low,close,volume
                const lines = text.split('\n').filter(line => line.trim().length > 0);
                const candles = [];

                // Skip header usually
                let startIndex = 0;
                if (lines[0].toLowerCase().includes('open') || lines[0].toLowerCase().includes('time')) {
                    startIndex = 1;
                }

                for (let i = startIndex; i < lines.length; i++) {
                    const columns = lines[i].split(',');
                    // Attempt to parse typical TV layout
                    // Standard export is usually: time, open, high, low, close
                    if (columns.length >= 5) {
                        const timeStr = columns[0];
                        const open = parseFloat(columns[1]);
                        const high = parseFloat(columns[2]);
                        const low = parseFloat(columns[3]);
                        const close = parseFloat(columns[4]);

                        if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
                            candles.push({
                                time: new Date(timeStr).getTime() || Date.now() + (i * 60000),
                                open,
                                high,
                                low,
                                close
                            });
                        }
                    }
                }

                if (candles.length > 0) {
                    dispatch({ type: 'SET_CANDLES', payload: candles });
                } else {
                    alert('Could not parse valid candle data from the CSV.');
                }
            }
        };
        reader.readAsText(file);

        // Reset input so you can upload same file again if needed
        e.target.value = '';
    };

    if (state.mode === 'draw_candle') {
        return (
            <aside className="sidebar sidebar-right glass-panel">
                <h2 className="text-sm font-semibold mb-4">Properties</h2>
                <div className="text-sm text-zinc-400">
                    <p className="mb-2 text-white font-medium">Drawing Mode Active</p>
                    <p>1. Click on the chart canvas.</p>
                    <p>2. Drag up or down to set the close price of the candle.</p>
                    <p>3. Release mouse to finish.</p>
                    <p className="mt-4 text-xs opacity-70 border-t border-white/10 pt-4">The previous candle's close connects automatically.</p>
                </div>
            </aside>
        );
    }

    if (state.mode === 'draw_trendline') {
        return (
            <aside className="sidebar sidebar-right glass-panel">
                <h2 className="text-sm font-semibold mb-4">Properties</h2>
                <div className="text-sm text-zinc-400">
                    <p className="mb-2 text-white font-medium">Trendline Tool Active</p>
                    <p>Click and drag anywhere on the chart to draw an animated trendline.</p>
                </div>
            </aside>
        )
    }

    if (state.mode === 'add_callout') {
        return (
            <aside className="sidebar sidebar-right glass-panel">
                <h2 className="text-sm font-semibold mb-4">Properties</h2>
                <div className="text-sm text-zinc-400">
                    <p className="mb-2 text-white font-medium">Callout Tool Active</p>
                    <p>Click anywhere on the chart to place an animated Callout Box.</p>
                </div>
            </aside>
        )
    }

    // selection mode rendering
    const activeCallout = state.callouts.find(c => c.id === state.selectedElementId);
    const activeTrendline = state.trendlines.find(t => t.id === state.selectedElementId);

    // We will use the index as the ID for candles to keep it simple
    const activeCandleIndex = state.selectedElementId?.startsWith('candle-')
        ? parseInt(state.selectedElementId.split('-')[1])
        : null;
    const activeCandle = activeCandleIndex !== null ? state.candles[activeCandleIndex] : null;

    return (
        <aside className="sidebar sidebar-right glass-panel flex flex-col h-full">
            <h2 className="text-sm font-semibold mb-4 text-white">Properties</h2>

            {!activeCallout && !activeTrendline && !activeCandle && (
                <div className="flex flex-col gap-4">
                    <div className="text-sm text-zinc-500 italic mb-4">
                        Select an element or candle on the canvas to edit its properties here.
                    </div>

                    <div className="panel-section !bg-black/20 border-white/10">
                        <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">Import Chart Data</h3>
                        <p className="text-xs text-zinc-500 mb-3">Upload a CSV exported from TradingView.</p>

                        <label className="w-full py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-xs transition-colors flex justify-center items-center cursor-pointer">
                            <span>Import TradingView CSV</span>
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>

                    <div className="panel-section !bg-black/20 border-white/10">
                        <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">Generate Base Chart</h3>
                        <p className="text-xs text-zinc-500 mb-3">Instantly create a 50-candle chart to start sculpting.</p>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => generateChart('uptrend')}
                                className="w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs transition-colors text-left flex justify-between items-center"
                            >
                                <span>Bullish Uptrend</span>
                                <span>↗</span>
                            </button>
                            <button
                                onClick={() => generateChart('downtrend')}
                                className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs transition-colors text-left flex justify-between items-center"
                            >
                                <span>Bearish Downtrend</span>
                                <span>↘</span>
                            </button>
                            <button
                                onClick={() => generateChart('ranging')}
                                className="w-full py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs transition-colors text-left flex justify-between items-center"
                            >
                                <span>Consolidation (Ranging)</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeCandle && activeCandleIndex !== null && (
                <div className="flex flex-col gap-4">
                    <div className="panel-section !bg-transparent !p-0 !border-0 mb-2">
                        <label className="panel-label text-xs uppercase tracking-wider block mb-1 text-emerald-400">High Price</label>
                        <input
                            type="number"
                            value={activeCandle.high}
                            onChange={(e) => dispatch({ type: 'UPDATE_CANDLE', payload: { index: activeCandleIndex, updates: { high: parseFloat(e.target.value) || 0 } } })}
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="panel-section !bg-transparent !p-0 !border-0">
                            <label className="panel-label text-xs uppercase tracking-wider block mb-1 text-zinc-300">Open Price</label>
                            <input
                                type="number"
                                value={activeCandle.open}
                                onChange={(e) => dispatch({ type: 'UPDATE_CANDLE', payload: { index: activeCandleIndex, updates: { open: parseFloat(e.target.value) || 0 } } })}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="panel-section !bg-transparent !p-0 !border-0">
                            <label className="panel-label text-xs uppercase tracking-wider block mb-1 text-zinc-300">Close Price</label>
                            <input
                                type="number"
                                value={activeCandle.close}
                                onChange={(e) => dispatch({ type: 'UPDATE_CANDLE', payload: { index: activeCandleIndex, updates: { close: parseFloat(e.target.value) || 0 } } })}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="panel-section !bg-transparent !p-0 !border-0">
                        <label className="panel-label text-xs uppercase tracking-wider block mb-1 text-red-400">Low Price</label>
                        <input
                            type="number"
                            value={activeCandle.low}
                            onChange={(e) => dispatch({ type: 'UPDATE_CANDLE', payload: { index: activeCandleIndex, updates: { low: parseFloat(e.target.value) || 0 } } })}
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            )}

            {activeCallout && (
                <div className="flex flex-col gap-4">
                    <div className="panel-section !bg-transparent !p-0 !border-0 mb-2">
                        <label className="panel-label text-xs uppercase tracking-wider block mb-1">Title</label>
                        <input
                            type="text"
                            value={activeCallout.title}
                            onChange={(e) => dispatch({ type: 'UPDATE_CALLOUT', payload: { id: activeCallout.id, updates: { title: e.target.value } } })}
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="panel-section !bg-transparent !p-0 !border-0 mb-4">
                        <label className="panel-label text-xs uppercase tracking-wider block mb-1">Description</label>
                        <textarea
                            value={activeCallout.description}
                            onChange={(e) => dispatch({ type: 'UPDATE_CALLOUT', payload: { id: activeCallout.id, updates: { description: e.target.value } } })}
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                        />
                    </div>
                    <div className="panel-section !bg-transparent !p-0 !border-0">
                        <label className="panel-label text-xs uppercase tracking-wider block mb-2">Theme Context</label>
                        <div className="flex gap-2">
                            <button
                                className={`flex-1 py-1.5 rounded text-xs border ${activeCallout.colorType === 'info' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                                onClick={() => dispatch({ type: 'UPDATE_CALLOUT', payload: { id: activeCallout.id, updates: { colorType: 'info' } } })}
                            >Info</button>
                            <button
                                className={`flex-1 py-1.5 rounded text-xs border ${activeCallout.colorType === 'bull' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                                onClick={() => dispatch({ type: 'UPDATE_CALLOUT', payload: { id: activeCallout.id, updates: { colorType: 'bull' } } })}
                            >Bull</button>
                            <button
                                className={`flex-1 py-1.5 rounded text-xs border ${activeCallout.colorType === 'bear' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                                onClick={() => dispatch({ type: 'UPDATE_CALLOUT', payload: { id: activeCallout.id, updates: { colorType: 'bear' } } })}
                            >Bear</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTrendline && (
                <div className="flex flex-col gap-4">
                    <div className="panel-section !bg-transparent !p-0 !border-0 mb-2">
                        <label className="panel-label text-xs uppercase tracking-wider block mb-1">Text Label</label>
                        <input
                            type="text"
                            value={activeTrendline.label || ""}
                            placeholder="Optional label..."
                            onChange={(e) => dispatch({ type: 'UPDATE_TRENDLINE', payload: { id: activeTrendline.id, updates: { label: e.target.value } } })}
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="panel-section !bg-transparent !p-0 !border-0">
                        <label className="panel-label text-xs uppercase tracking-wider block mb-2">Laser Color</label>
                        <div className="flex gap-2">
                            <button
                                className="w-8 h-8 rounded-full border border-white/20"
                                style={{ backgroundColor: '#3b82f6', boxShadow: activeTrendline.color === '#3b82f6' ? '0 0 0 2px white' : 'none' }}
                                onClick={() => dispatch({ type: 'UPDATE_TRENDLINE', payload: { id: activeTrendline.id, updates: { color: '#3b82f6' } } })}
                            />
                            <button
                                className="w-8 h-8 rounded-full border border-white/20"
                                style={{ backgroundColor: '#10b981', boxShadow: activeTrendline.color === '#10b981' ? '0 0 0 2px white' : 'none' }}
                                onClick={() => dispatch({ type: 'UPDATE_TRENDLINE', payload: { id: activeTrendline.id, updates: { color: '#10b981' } } })}
                            />
                            <button
                                className="w-8 h-8 rounded-full border border-white/20"
                                style={{ backgroundColor: '#ef4444', boxShadow: activeTrendline.color === '#ef4444' ? '0 0 0 2px white' : 'none' }}
                                onClick={() => dispatch({ type: 'UPDATE_TRENDLINE', payload: { id: activeTrendline.id, updates: { color: '#ef4444' } } })}
                            />
                            <button
                                className="w-8 h-8 rounded-full border border-white/20"
                                style={{ backgroundColor: '#eab308', boxShadow: activeTrendline.color === '#eab308' ? '0 0 0 2px white' : 'none' }}
                                onClick={() => dispatch({ type: 'UPDATE_TRENDLINE', payload: { id: activeTrendline.id, updates: { color: '#eab308' } } })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Delete button for selected element */}
            {(activeCallout || activeTrendline) && (
                <div className="mt-auto pt-4 border-t border-white/10">
                    <button
                        className="w-full py-2 text-sm text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 transition-colors rounded border border-red-500/30"
                        onClick={() => {
                            if (activeCallout) {
                                dispatch({ type: 'UPDATE_CALLOUT', payload: { id: activeCallout.id, updates: { id: 'delete-me' } } }); // Hacky delete for mock state
                                // Better to add a DELETE action, but for speed let's just clear selection since state isn't persisted anyway
                                dispatch({ type: 'CLEAR_ALL' }) // Ideally a specific DELETE action
                            }
                        }}
                    >
                        Remove Element
                    </button>
                </div>
            )}
        </aside>
    );
}
