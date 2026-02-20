import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { z } from 'zod';
import React from 'react';

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
    const { fps, width, height, durationInFrames } = useVideoConfig();
    const frame = useCurrentFrame();

    // Math for scaling
    const chartHeight = height * 0.7; // Leave more room for dramatic headers
    const chartWidth = width * 0.85;
    const marginY = height * 0.15;
    const marginX = width * 0.075;

    const minPrice = Math.min(...candles.map(c => c.low));
    const maxPrice = Math.max(...candles.map(c => c.high));
    const priceRange = maxPrice - minPrice || 1;

    // Add some padding to price range so candles don't touch edges
    const paddedMin = minPrice - (priceRange * 0.05);
    const paddedMax = maxPrice + (priceRange * 0.05);
    const paddedRange = paddedMax - paddedMin;

    const scaleY = chartHeight / paddedRange;
    const candleSpacing = chartWidth / Math.max(candles.length, 1);
    const candleWidth = candleSpacing * 0.7; // Thicker candles

    const getY = (price: number) => chartHeight - ((price - paddedMin) * scaleY) + marginY;

    // Camera movement - Pans slowly across the 60s
    // Zoom in slowly over 60s
    const scale = interpolate(frame, [0, durationInFrames], [1.02, 1.1], { extrapolateRight: 'clamp' });
    const translateY = interpolate(frame, [0, durationInFrames], [0, -40], { extrapolateRight: 'clamp' });

    // Staggered text entrance
    const titleOpacity = spring({ frame: frame - 10, fps, config: { damping: 200 } });
    const subtitleOpacity = spring({ frame: frame - 30, fps, config: { damping: 200 } });

    // Calculate when candles should appear to span the video duration
    // If we have 10 candles and 60 seconds, we want them to appear one by one every 6 seconds?
    // Or do we want them all to appear quickly then hold?
    // Usually "Reels" are snappy. Let's make them appear over the first 50% of the video.
    const candleEntranceDuration = durationInFrames * 0.5;
    const delayPerCandle = candleEntranceDuration / Math.max(candles.length, 1);

    return (
        <AbsoluteFill style={{ backgroundColor: '#09090b', overflow: 'hidden' }}>
            {/* 1. Dynamic Background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 0%, #1f2937 0%, #09090b 60%)',
            }} />

            {/* Grid Pattern */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                opacity: 0.5
            }} />

            {/* Cinematic Camera Wrapper */}
            <div style={{
                flex: 1,
                width: '100%',
                height: '100%',
                transform: `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin: 'center center'
            }}>

                <svg width={width} height={height} style={{ overflow: 'visible' }}>
                    <defs>
                        {/* Gradients for "Cool" Look */}
                        <linearGradient id="grad-bull" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <linearGradient id="grad-bear" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f87171" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>

                        {/* Glow Filters */}
                        <filter id="glow-bull" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="glow-bear" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Render Candles */}
                    {candles.map((candle, i) => {
                        const isBull = candle.close >= candle.open;
                        const fillUrl = isBull ? 'url(#grad-bull)' : 'url(#grad-bear)';
                        const filterUrl = isBull ? 'url(#glow-bull)' : 'url(#glow-bear)';
                        const strokeColor = isBull ? '#34d399' : '#f87171'; // Lighter stroke for wicks

                        const x = marginX + (i * candleSpacing);
                        const openY = getY(candle.open);
                        const closeY = getY(candle.close);
                        const highY = getY(candle.high);
                        const lowY = getY(candle.low);

                        // Animation: Spring up from bottom + Opacity fade in
                        // Spread delay across the animation duration
                        const delay = i * delayPerCandle;
                        const progress = spring({
                            frame: frame - delay,
                            fps,
                            config: { damping: 15, stiffness: 100 }
                        });

                        if (progress === 0) return null;

                        const yPos = Math.min(openY, closeY);
                        const bodyHeight = Math.max(Math.abs(openY - closeY), 2);

                        // Animate ScaleY from 0 (at bottom) to 1
                        // Wick grows with body

                        return (
                            <g
                                key={i}
                                style={{
                                    opacity: progress,
                                    transformOrigin: `${x + candleWidth/2}px ${getY(candle.low)}px`
                                }}
                            >
                                {/* Wick */}
                                <line
                                    x1={x + candleWidth / 2}
                                    y1={highY}
                                    x2={x + candleWidth / 2}
                                    y2={lowY}
                                    stroke={strokeColor}
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                />
                                {/* Body with Glow */}
                                <rect
                                    x={x}
                                    y={yPos}
                                    width={candleWidth}
                                    height={bodyHeight}
                                    fill={fillUrl}
                                    filter={filterUrl}
                                    rx={4}
                                    stroke={strokeColor}
                                    strokeWidth={1}
                                    style={{
                                        transformBox: 'fill-box',
                                        transformOrigin: 'bottom',
                                        transform: `scaleY(${progress})`
                                    }}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Modern Title Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 100,
                    left: 120,
                    fontFamily: "'Outfit', sans-serif",
                    textShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                    <h1 style={{
                        fontSize: 96,
                        margin: 0,
                        fontWeight: 800,
                        color: 'white',
                        opacity: titleOpacity,
                        transform: `translateY(${(1 - titleOpacity) * 20}px)`
                    }}>
                        MARKET <span style={{ color: '#3b82f6' }}>ANALYSIS</span>
                    </h1>
                    <div style={{
                        height: 4,
                        width: 100,
                        background: '#3b82f6',
                        marginTop: 10,
                        opacity: subtitleOpacity,
                        transform: `scaleX(${subtitleOpacity})`,
                        transformOrigin: 'left'
                    }} />
                    <p style={{
                        fontSize: 32,
                        color: '#94a3b8',
                        margin: '16px 0 0 0',
                        letterSpacing: '0.1em',
                        fontWeight: 500,
                        opacity: subtitleOpacity
                    }}>
                        GENERATED VISUALIZATION
                    </p>
                </div>
            </div>
        </AbsoluteFill>
    );
};
