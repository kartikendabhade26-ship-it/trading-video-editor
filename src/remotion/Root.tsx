import { Composition } from 'remotion';
import { TradingComposition, myCompSchema } from './TradingComposition';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="TradingAnimation"
                component={TradingComposition}
                durationInFrames={300} // 5 seconds at 60fps
                fps={60}
                width={1920}
                height={1080}
                schema={myCompSchema}
                defaultProps={{
                    pattern: 'bull_flag'
                }}
            />
        </>
    );
};
