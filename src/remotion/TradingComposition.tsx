import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring } from 'remotion';
import { z } from 'zod';

export const myCompSchema = z.object({
    candles: z.array(z.object({
        open: z.number(),
        close: z.number(),
        high: z.number(),
        low: z.number(),
        time: z.number().optional(),
    }))
});

export const TradingComposition: React.FC<z.infer<typeof myCompSchema>> = ({ candles }) => {
    const { fps, width, height } = useVideoConfig();
    const frame = useCurrentFrame();

    // Math for scaling
    const chartHeight = height * 0.8;
    const chartWidth = width * 0.8;
    const marginY = height * 0.1;
    const marginX = width * 0.1;

    const minPrice = Math.min(...candles.map(c => c.low));
    const maxPrice = Math.max(...candles.map(c => c.high));
    const priceRange = maxPrice - minPrice || 1;

    const scaleY = chartHeight / priceRange;
    const candleSpacing = chartWidth / Math.max(candles.length, 1);
    const candleWidth = candleSpacing * 0.6; // 60% of available space

    const getY = (price: number) => chartHeight - ((price - minPrice) * scaleY) + marginY;

    return (
        <AbsoluteFill style={{ backgroundColor: '#09090b' }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>

                {/* Background Grid */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '100px 100px',
                    pointerEvents: 'none'
                }} />

                <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
                    {candles.map((candle, i) => {
                        const isBull = candle.close >= candle.open;
                        const color = isBull ? '#10b981' : '#ef4444';
                        const x = marginX + (i * candleSpacing);
                        const openY = getY(candle.open);
                        const closeY = getY(candle.close);
                        const highY = getY(candle.high);
                        const lowY = getY(candle.low);

                        // Remotion Animation: Animate in sequentially
                        const delay = i * 2; // 2 frames delay per candle
                        const animationProgress = spring({
                            frame: frame - delay,
                            fps,
                            config: { damping: 12 }
                        });

                        // Scale from 0 to 1 based on spring
                        if (animationProgress === 0) return null; // Don't render yet

                        const yPos = Math.min(openY, closeY);
                        const bodyHeight = Math.max(Math.abs(openY - closeY), 2); // Minimum 2px body

                        return (
                            <g key={i} transform={`scale(1, ${animationProgress}) translate(0, ${height * (1 - animationProgress)})`} style={{ transformOrigin: `${x}px ${getY(candle.low)}px` }}>
                                {/* Wick */}
                                <line
                                    x1={x + candleWidth / 2}
                                    y1={highY}
                                    x2={x + candleWidth / 2}
                                    y2={lowY}
                                    stroke={color}
                                    strokeWidth={4}
                                />
                                {/* Body */}
                                <rect
                                    x={x}
                                    y={yPos}
                                    width={candleWidth}
                                    height={bodyHeight}
                                    fill={color}
                                    rx={4}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Title overlay */}
                <div style={{ position: 'absolute', top: 80, left: 100, color: 'white', fontFamily: 'sans-serif', opacity: spring({ frame: frame - 60, fps }) }}>
                    <h1 style={{ fontSize: 80, margin: 0, fontWeight: 800 }}>
                        Custom Candlestick Chart
                    </h1>
                    <p style={{ fontSize: 40, color: '#9ca3af', margin: 0 }}>Manual Visualization</p>
                </div>
            </div>
        </AbsoluteFill>
    );
};
