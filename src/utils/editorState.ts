import { type CandleData } from './mockData';

export type EditorMode = 'select' | 'draw_candle' | 'draw_trendline' | 'add_callout';

export interface Point { x: number; y: number }

export interface TrendlineData {
    id: string;
    points: Point[];
    color: string;
    label?: string;
    delayIndex: number;
}

export interface CalloutData {
    id: string;
    x: number;
    y: number;
    title: string;
    description: string;
    colorType: 'bull' | 'bear' | 'info';
    delayIndex: number;
}

export interface EditorState {
    mode: EditorMode;
    candles: CandleData[];
    trendlines: TrendlineData[];
    callouts: CalloutData[];
    selectedElementId: string | null;
}

export type Action =
    | { type: 'SET_MODE'; payload: EditorMode }
    | { type: 'ADD_CANDLE'; payload: CandleData }
    | { type: 'SET_CANDLES'; payload: CandleData[] }
    | { type: 'UPDATE_CANDLE'; payload: { index: number, updates: Partial<CandleData> } }
    | { type: 'ADD_TRENDLINE'; payload: TrendlineData }
    | { type: 'UPDATE_TRENDLINE'; payload: { id: string, updates: Partial<TrendlineData> } }
    | { type: 'ADD_CALLOUT'; payload: CalloutData }
    | { type: 'UPDATE_CALLOUT'; payload: { id: string, updates: Partial<CalloutData> } }
    | { type: 'SELECT_ELEMENT'; payload: string | null }
    | { type: 'CLEAR_ALL' };

export const initialState: EditorState = {
    mode: 'select',
    candles: [],
    trendlines: [],
    callouts: [],
    selectedElementId: null,
};

export function editorReducer(state: EditorState, action: Action): EditorState {
    switch (action.type) {
        case 'SET_MODE':
            return { ...state, mode: action.payload, selectedElementId: null };
        case 'ADD_CANDLE':
            return { ...state, candles: [...state.candles, action.payload] };
        case 'SET_CANDLES':
            return { ...state, candles: action.payload };
        case 'UPDATE_CANDLE': {
            const newCandles = [...state.candles];
            newCandles[action.payload.index] = {
                ...newCandles[action.payload.index],
                ...action.payload.updates
            };
            return { ...state, candles: newCandles };
        }
        case 'ADD_TRENDLINE':
            return { ...state, trendlines: [...state.trendlines, action.payload], selectedElementId: action.payload.id };
        case 'UPDATE_TRENDLINE':
            return {
                ...state,
                trendlines: state.trendlines.map(t =>
                    t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
                )
            };
        case 'ADD_CALLOUT':
            return { ...state, callouts: [...state.callouts, action.payload], selectedElementId: action.payload.id };
        case 'UPDATE_CALLOUT':
            return {
                ...state,
                callouts: state.callouts.map(c =>
                    c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
                )
            };
        case 'SELECT_ELEMENT':
            return { ...state, selectedElementId: action.payload };
        case 'CLEAR_ALL':
            return { ...state, candles: [], trendlines: [], callouts: [], selectedElementId: null };
        default:
            return state;
    }
}
