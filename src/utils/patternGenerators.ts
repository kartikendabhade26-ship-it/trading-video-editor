// A collection of realistic-looking candle data generators for different chart patterns.

export interface Candle {
    open: number;
    close: number;
    high: number;
    low: number;
}

// Generate a random candle given a starting price and volatility
function generateCandle(startPrice: number, direction: 'bull' | 'bear' | 'neutral', volatility: number = 2): Candle {
    const isBull = direction === 'bull' || (direction === 'neutral' && Math.random() > 0.5);
    const bodySize = Math.random() * volatility;

    const open = startPrice;
    const close = isBull ? open + bodySize : open - bodySize;
    const high = Math.max(open, close) + (Math.random() * (volatility * 0.5));
    const low = Math.min(open, close) - (Math.random() * (volatility * 0.5));

    return { open, close, high, low };
}

export function generatePattern(patternName: string, numCandles: number = 60, startPrice: number = 100): Candle[] {
    const candles: Candle[] = [];
    let currentPrice = startPrice;

    if (patternName === 'bull_flag') {
        // Phase 1: The Flag Pole (Strong Uptrend) - 20% of candles
        const poleCandles = Math.floor(numCandles * 0.2);
        for (let i = 0; i < poleCandles; i++) {
            const c = generateCandle(currentPrice, 'bull', 4);
            candles.push(c);
            currentPrice = c.close;
        }

        // Phase 2: The Flag (Consolidating downward channel) - 60% of candles
        const flagCandles = Math.floor(numCandles * 0.6);
        for (let i = 0; i < flagCandles; i++) {
            // Slight downward bias but mixed
            const drift = i % 3 === 0 ? 'bull' : 'bear';
            const c = generateCandle(currentPrice, drift, 1.5);
            candles.push(c);
            currentPrice = c.close;
        }

        // Phase 3: The Breakout - Remaining 20%
        const remaining = numCandles - candles.length;
        for (let i = 0; i < remaining; i++) {
            const c = generateCandle(currentPrice, 'bull', 5); // Huge volatility breakout
            candles.push(c);
            currentPrice = c.close;
        }
    }
    else {
        // Default random walk
        for (let i = 0; i < numCandles; i++) {
            const c = generateCandle(currentPrice, 'neutral', 2);
            candles.push(c);
            currentPrice = c.close;
        }
    }

    return candles;
}
