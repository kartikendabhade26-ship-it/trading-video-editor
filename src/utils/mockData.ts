export interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

// Generate realistic looking dummy trading data
export function generateMockData(numCandles: number = 50, startPrice: number = 42000): CandleData[] {
    let currentPrice = startPrice;
    const data: CandleData[] = [];
    let currentTime = new Date().getTime();

    for (let i = 0; i < numCandles; i++) {
        // Generate random but logical candle
        const volatility = currentPrice * 0.005; // 0.5% volatility per candle

        // Add some trend bias - random drift
        const trend = (Math.random() - 0.45) * volatility;

        const open = currentPrice;
        const close = open + trend + (Math.random() - 0.5) * volatility;

        // High must be >= open/close
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        // Low must be <= open/close
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        data.push({
            time: currentTime,
            open,
            high,
            low,
            close
        });

        currentPrice = close;
        // Advance time by 15 mins
        currentTime += 15 * 60 * 1000;
    }

    return data;
}

export const mockChartData = generateMockData(60, 65000);
