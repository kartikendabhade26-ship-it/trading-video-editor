import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface CalloutProps {
    x: number;
    y: number;
    title: string;
    description: string;
    delay?: number;
    colorType?: 'bull' | 'bear' | 'info';
}

export default function Callout({
    x, y, title, description, delay = 0, colorType = 'info'
}: CalloutProps) {

    let accentColor = "var(--accent-color)";
    let accentGlow = "rgba(59, 130, 246, 0.5)";

    if (colorType === 'bull') {
        accentColor = "var(--bull-color)";
        accentGlow = "rgba(16, 185, 129, 0.5)";
    } else if (colorType === 'bear') {
        accentColor = "var(--bear-color)";
        accentGlow = "rgba(239, 68, 68, 0.5)";
    }

    return (
        <motion.div
            className="callout glass-panel"
            style={{ left: x, top: y, boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px ${accentGlow}` }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay, type: "spring", stiffness: 200, damping: 15 }}
        >
            <div className="callout-header">
                <div
                    className="callout-icon"
                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                    <Zap className="pulse" />
                </div>
                <h3 className="callout-title uppercase tracking-wide font-bold">
                    {title}
                </h3>
            </div>

            <p className="callout-desc font-mono text-xs">
                {description}
            </p>

            {/* Connection Line */}
            <div style={{
                position: 'absolute',
                bottom: '-40px', left: '24px', width: '2px', height: '40px',
                backgroundImage: `linear-gradient(to top, transparent, ${accentColor})`
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-40px', left: '21px', width: '8px', height: '8px',
                borderRadius: '50%', backgroundColor: accentColor,
                boxShadow: `0 0 10px ${accentColor}`
            }} />
        </motion.div>
    );
}
