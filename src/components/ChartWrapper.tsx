import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { type CandleData } from '../utils/mockData';
import Candlestick from './Candlestick';
import Trendline from './Trendline';
import Callout from './Callout';
import { type EditorState, type Action } from '../utils/editorState';

interface ChartWrapperProps {
    isPlaying: boolean;
    state: EditorState;
    dispatch: React.Dispatch<Action>;
}

export default function ChartWrapper({ isPlaying, state, dispatch }: ChartWrapperProps) {
    const [scale, setScale] = useState(1);
    const svgRef = useRef<SVGSVGElement>(null);

    // State for drag drawing a candle or trendline or sculpting
    const [isDrawing, setIsDrawing] = useState(false);
    const [sculptingTarget, setSculptingTarget] = useState<{ index: number, part: 'body' | 'high' | 'low', startY: number, startProp: number } | null>(null);

    useEffect(() => {
        if (isPlaying) {
            setScale(1.2);
        } else {
            setScale(1.0);
        }
    }, [isPlaying]);

    const chartHeight = 800;
    const columnWidth = 16;
    const gap = 8;

    // Scale dynamically based on drawn candles or default
    const prices = state.candles.flatMap(c => [c.high, c.low]);
    const maxPrice = prices.length > 0 ? Math.max(...prices) * 1.05 : 66000;
    const minPrice = prices.length > 0 ? Math.min(...prices) * 0.95 : 64000;

    const priceRange = maxPrice - minPrice;
    const scaleY = chartHeight / priceRange;

    // Convert pixel Y to price
    const getPriceFromY = (y: number) => minPrice + ((chartHeight - y) / scaleY);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementId?.startsWith('candle-')) {
                const index = parseInt(state.selectedElementId.split('-')[1]);
                if (!isNaN(index)) {
                    // We need a DELETE_CANDLE action. Let's spoof it with SET_CANDLES for now
                    const newCandles = [...state.candles];
                    newCandles.splice(index, 1);
                    dispatch({ type: 'SET_CANDLES', payload: newCandles });
                    dispatch({ type: 'SELECT_ELEMENT', payload: null });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.selectedElementId, state.candles, dispatch]);

    const handlePointerDown = (e: React.PointerEvent) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const y = e.clientY - rect.top;
        const x = e.clientX - rect.left;
        const price = getPriceFromY(y);

        if (state.mode === 'draw_candle') {
            const prevClose = state.candles.length > 0 ? state.candles[state.candles.length - 1].close : price;
            const newCandle: CandleData = {
                time: Date.now(),
                open: prevClose,
                close: price,
                high: Math.max(prevClose, price) + (Math.max(prevClose, price) * 0.001),
                low: Math.min(prevClose, price) - (Math.min(prevClose, price) * 0.001)
            };
            dispatch({ type: 'ADD_CANDLE', payload: newCandle });
            setIsDrawing(true);
            (e.target as Element).releasePointerCapture(e.pointerId);
        }
        else if (state.mode === 'draw_trendline') {
            const newLineId = `trendline-${Date.now()}`;
            dispatch({
                type: 'ADD_TRENDLINE',
                payload: {
                    id: newLineId,
                    points: [{ x, y }, { x, y }], // Start with both points at click origin
                    color: "var(--accent-color)",
                    delayIndex: state.candles.length
                }
            });
            setIsDrawing(true);
            (e.target as Element).releasePointerCapture(e.pointerId);
        }
        else if (state.mode === 'add_callout') {
            dispatch({
                type: 'ADD_CALLOUT',
                payload: {
                    id: `callout-${Date.now()}`,
                    x,
                    y,
                    title: "New Callout",
                    description: "Double click to edit in properties.",
                    colorType: "info",
                    delayIndex: state.candles.length
                }
            });
            dispatch({ type: 'SET_MODE', payload: 'select' }); // Auto revert to select after placing
        }
        else if (state.mode === 'select') {
            // Very basic collision detection for selection (clicking near a callout / trendline end)
            const clickedCallout = state.callouts.find(c => Math.abs(c.x - x) < 50 && Math.abs(c.y - y) < 50);
            if (clickedCallout) {
                dispatch({ type: 'SELECT_ELEMENT', payload: clickedCallout.id });
                return;
            }

            const clickedTrendline = state.trendlines.find(t =>
                t.points.some(p => Math.abs(p.x - x) < 50 && Math.abs(p.y - y) < 50)
            );
            if (clickedTrendline) {
                dispatch({ type: 'SELECT_ELEMENT', payload: clickedTrendline.id });
                return;
            }

            // Check if we clicked a candle to sculpt it
            const candleIndexClicked = Math.floor(x / (columnWidth + gap));
            if (candleIndexClicked >= 0 && candleIndexClicked < state.candles.length) {
                const candle = state.candles[candleIndexClicked];
                const openY = chartHeight - ((candle.open - minPrice) * scaleY);
                const closeY = chartHeight - ((candle.close - minPrice) * scaleY);
                const highY = chartHeight - ((candle.high - minPrice) * scaleY);
                const lowY = chartHeight - ((candle.low - minPrice) * scaleY);

                const topBodyY = Math.min(openY, closeY);
                const bottomBodyY = Math.max(openY, closeY);

                // Which part was clicked?
                // Add some padding to making clicking wicks easier
                if (y >= highY - 10 && y <= topBodyY) {
                    setSculptingTarget({ index: candleIndexClicked, part: 'high', startY: y, startProp: candle.high });
                    dispatch({ type: 'SELECT_ELEMENT', payload: `candle-${candleIndexClicked}` });
                    (e.target as Element).setPointerCapture(e.pointerId);
                } else if (y >= bottomBodyY && y <= lowY + 10) {
                    setSculptingTarget({ index: candleIndexClicked, part: 'low', startY: y, startProp: candle.low });
                    dispatch({ type: 'SELECT_ELEMENT', payload: `candle-${candleIndexClicked}` });
                    (e.target as Element).setPointerCapture(e.pointerId);
                } else if (y >= topBodyY && y <= bottomBodyY) {
                    // Clicked body - drag whole candle up/down
                    setSculptingTarget({ index: candleIndexClicked, part: 'body', startY: y, startProp: candle.open }); // Arbitrary start prop to calculate delta
                    dispatch({ type: 'SELECT_ELEMENT', payload: `candle-${candleIndexClicked}` });
                    (e.target as Element).setPointerCapture(e.pointerId);
                } else {
                    dispatch({ type: 'SELECT_ELEMENT', payload: `candle-${candleIndexClicked}` });
                }
                return;
            }

            dispatch({ type: 'SELECT_ELEMENT', payload: null });
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing && !sculptingTarget) return;

        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const currentY = e.clientY - rect.top;
        const currentX = e.clientX - rect.left;

        if (sculptingTarget && state.mode === 'select') {
            const { index, part, startY } = sculptingTarget;
            const currentPrice = getPriceFromY(currentY);
            const startPrice = getPriceFromY(startY);
            const priceDelta = currentPrice - startPrice;

            const candle = state.candles[index];

            if (part === 'high') {
                dispatch({ type: 'UPDATE_CANDLE', payload: { index, updates: { high: Math.max(Math.max(candle.open, candle.close), candle.high + priceDelta) } } });
                setSculptingTarget({ ...sculptingTarget, startY: currentY, startProp: candle.high + priceDelta });
            } else if (part === 'low') {
                dispatch({ type: 'UPDATE_CANDLE', payload: { index, updates: { low: Math.min(Math.min(candle.open, candle.close), candle.low + priceDelta) } } });
                setSculptingTarget({ ...sculptingTarget, startY: currentY, startProp: candle.low + priceDelta });
            } else if (part === 'body') {
                // Move the whole candle
                dispatch({
                    type: 'UPDATE_CANDLE', payload: {
                        index,
                        updates: {
                            open: candle.open + priceDelta,
                            close: candle.close + priceDelta,
                            high: candle.high + priceDelta,
                            low: candle.low + priceDelta
                        }
                    }
                });
                setSculptingTarget({ ...sculptingTarget, startY: currentY, startProp: candle.open + priceDelta });
            }
            return;
        }

        if (state.mode === 'draw_candle' && state.candles.length > 0) {
            const currentPrice = getPriceFromY(currentY);
            const currentIndex = state.candles.length - 1;
            const editingCandle = state.candles[currentIndex];

            dispatch({
                type: 'UPDATE_CANDLE',
                payload: {
                    index: currentIndex,
                    updates: {
                        close: currentPrice,
                        high: Math.max(editingCandle.open, currentPrice) + (Math.abs(editingCandle.open - currentPrice) * 0.1),
                        low: Math.min(editingCandle.open, currentPrice) - (Math.abs(editingCandle.open - currentPrice) * 0.1),
                    }
                }
            });
        }
        else if (state.mode === 'draw_trendline' && state.selectedElementId) {
            const activeLine = state.trendlines.find(t => t.id === state.selectedElementId);
            if (activeLine && activeLine.points.length > 0) {
                dispatch({
                    type: 'UPDATE_TRENDLINE',
                    payload: {
                        id: state.selectedElementId,
                        updates: {
                            points: [activeLine.points[0], { x: currentX, y: currentY }] // Update end point
                        }
                    }
                });
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isDrawing && state.mode === 'draw_trendline') {
            dispatch({ type: 'SET_MODE', payload: 'select' });
        }
        if (sculptingTarget) {
            (e.target as Element).releasePointerCapture(e.pointerId);
            setSculptingTarget(null);
        }
        setIsDrawing(false);
    };

    return (
        <motion.div
            className="composition-frame relative w-full h-full"
            style={{
                cursor: state.mode === 'draw_candle' ? 'crosshair' : 'default',
                width: '100%',
                height: '100%'
            }}
        >
            <div className="trading-grid"></div>

            <motion.div
                className="chart-inner"
                animate={{
                    scale: scale,
                    x: isPlaying ? -(state.candles.length * (columnWidth + gap)) * 0.3 : 0,
                    y: isPlaying ? 50 : 0
                }}
                transition={{ duration: 8, ease: "easeInOut" }}
            >
                <svg
                    ref={svgRef}
                    width="100%"
                    height={chartHeight}
                    style={{ overflow: "visible" }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {state.candles.map((candle, i) => (
                        <Candlestick
                            key={candle.time + i} // ensure force re-render if needed
                            data={candle}
                            index={i}
                            maxPrice={maxPrice}
                            minPrice={minPrice}
                            chartHeight={chartHeight}
                            columnWidth={columnWidth}
                            gap={gap}
                        />
                    ))}

                    {/* Interactively Drawn Trendlines */}
                    {state.trendlines.map((line) => (
                        // Only delay animation if video is playing, otherwise show immediately in editor
                        <Trendline
                            key={line.id}
                            points={line.points}
                            color={line.color}
                            label={line.label}
                            delay={isPlaying ? line.delayIndex * 0.05 + 0.5 : 0}
                        />
                    ))}
                </svg>

                {/* Floating Callout Boxes outide SVG but inside scaled div */}
                {state.callouts.map((callout) => (
                    <div key={callout.id} className="absolute pointer-events-none" style={{ top: 0, left: 0, width: '100%', height: '100%' }}>
                        <Callout
                            x={callout.x}
                            y={callout.y}
                            title={callout.title}
                            description={callout.description}
                            colorType={callout.colorType}
                            delay={isPlaying ? callout.delayIndex * 0.05 + 1.0 : 0}
                        />
                    </div>
                ))}

                {state.candles.length === 0 && state.trendlines.length === 0 && state.callouts.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-600 font-mono italic">
                        {state.mode === 'draw_candle' ? 'Click and drag to draw a candlestick' : 'Select a tool to begin'}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
