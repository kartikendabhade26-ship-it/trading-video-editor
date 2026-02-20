import { motion } from 'framer-motion';

interface TrendlineProps {
    points: { x: number; y: number }[];
    color?: string;
    delay?: number;
    label?: string;
}

export default function Trendline({
    points,
    color = "var(--accent-color)",
    delay = 0,
    label
}: TrendlineProps) {

    const pathData = points.reduce((acc, point, i) => {
        return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, "");

    const midPoint = points.length > 1 ? {
        x: (points[0].x + points[points.length - 1].x) / 2,
        y: (points[0].y + points[points.length - 1].y) / 2
    } : { x: 0, y: 0 };

    return (
        <motion.g>
            <motion.path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "blur(6px)", opacity: 0.5 }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ delay, duration: 1.5, ease: "easeInOut" }}
            />

            <motion.path
                d={pathData}
                fill="none"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay, duration: 1.5, ease: "easeInOut" }}
            />

            {label && (
                <motion.text
                    x={midPoint.x}
                    y={midPoint.y - 15}
                    fill={color}
                    fontSize="14"
                    fontWeight="600"
                    textAnchor="middle"
                    className="uppercase tracking-wider"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay + 1, duration: 0.5 }}
                >
                    {label}
                </motion.text>
            )}
        </motion.g>
    );
}
