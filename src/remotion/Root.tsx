import { Composition } from 'remotion';
import { TradingComposition, myCompSchema } from './TradingComposition';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            {/* Standard 16:9 Landscape Video */}
            <Composition
                id="TradingAnimation"
                component={TradingComposition}
                durationInFrames={3600} // 60 seconds at 60fps
                fps={60}
                width={1920}
                height={1080}
                schema={myCompSchema}
                defaultProps={{
                    candles: [
                        { open: 100, close: 105, high: 110, low: 95, time: 1 },
                        { open: 105, close: 102, high: 108, low: 100, time: 2 },
                        { open: 102, close: 112, high: 115, low: 101, time: 3 },
                        { open: 112, close: 110, high: 113, low: 108, time: 4 },
                        { open: 110, close: 125, high: 128, low: 109, time: 5 },
                    ]
                }}
            />
            {/* 9:16 Vertical Reel/Short */}
            <Composition
                id="TradingReel"
                component={TradingComposition}
                durationInFrames={3600} // 60 seconds
                fps={60}
                width={1080}
                height={1920}
                schema={myCompSchema}
                defaultProps={{
                    candles: [
                        { open: 100, close: 105, high: 110, low: 95, time: 1 },
                        { open: 105, close: 102, high: 108, low: 100, time: 2 },
                        { open: 102, close: 112, high: 115, low: 101, time: 3 },
                        { open: 112, close: 110, high: 113, low: 108, time: 4 },
                        { open: 110, close: 125, high: 128, low: 109, time: 5 },
                    ]
                }}
            />
        </>
    );
};
