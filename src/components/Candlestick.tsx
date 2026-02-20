import { motion } from 'framer-motion';
import { type CandleData } from '../utils/mockData';

interface CandlestickProps {
    data: CandleData;
    index: number;
    maxPrice: number;
    minPrice: number;
    chartHeight: number;
    columnWidth: number;
    gap: number;
}

export default function Candlestick({
    data, index, maxPrice, minPrice, chartHeight, columnWidth = 10, gap = 4
}: CandlestickProps) {

    const isBullish = data.close >= data.open;

    const priceRange = maxPrice - minPrice;
    const scaleY = chartHeight / priceRange;

    const getY = (price: number) => chartHeight - ((price - minPrice) * scaleY);

    const openY = getY(data.open);
    const closeY = getY(data.close);
    const highY = getY(data.high);
    const lowY = getY(data.low);

    const bodyTop = Math.min(openY, closeY);
    const bodyBottom = Math.max(openY, closeY);
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

    const wickTop = highY;
    const wickBottom = lowY;

    const xOffset = index * (columnWidth + gap);

    const staggerDelay = index * 0.05;

    const color = isBullish ? 'var(--bull-color)' : 'var(--bear-color)';
    const glow = isBullish ? 'var(--bull-glow)' : 'var(--bear-glow)';

    return (
        <motion.g
            style={{ fill: color, color: color }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: staggerDelay,
                type: "spring",
                stiffness: 100,
                damping: 15
            }}
        >
            <motion.line
                x1={xOffset + columnWidth / 2}
                y1={wickTop}
                x2={xOffset + columnWidth / 2}
                y2={wickBottom}
                stroke="currentColor"
                strokeWidth={1}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: staggerDelay + 0.1, duration: 0.4 }}
            />

            <motion.rect
                x={xOffset}
                y={bodyTop}
                width={columnWidth}
                height={bodyHeight}
                rx={1}
                style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
                initial={{ scaleY: 0, transformOrigin: 'bottom' }}
                animate={{ scaleY: 1 }}
                transition={{ delay: staggerDelay, duration: 0.4, type: "spring", stiffness: 120 }}
            />
        </motion.g>
    );
}
