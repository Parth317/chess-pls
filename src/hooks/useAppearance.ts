import React, { createContext, useContext, useState, useEffect } from 'react';

export type BoardTheme = 'blue' | 'green' | 'brown' | 'purple' | 'slate';
export type PieceTheme = 'cburnett' | 'merida' | 'alpha' | 'cheq' | 'maestro';
export type AppBackground = 'dark' | 'light' | 'space' | 'nature' | 'abstract';

interface AppearanceState {
    boardTheme: BoardTheme;
    pieceTheme: PieceTheme;
    appBackground: AppBackground;
    setBoardTheme: (theme: BoardTheme) => void;
    setPieceTheme: (theme: PieceTheme) => void;
    setAppBackground: (bg: AppBackground) => void;
}

const DEFAULT_STATE: Omit<AppearanceState, 'setBoardTheme' | 'setPieceTheme' | 'setAppBackground'> = {
    boardTheme: 'blue',
    pieceTheme: 'cburnett',
    appBackground: 'dark',
};

const AppearanceContext = createContext<AppearanceState | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
    const [boardTheme, setBoardTheme] = useState<BoardTheme>(() => {
        const saved = localStorage.getItem('gambit_board_theme');
        return (saved as BoardTheme) || DEFAULT_STATE.boardTheme;
    });

    const [pieceTheme, setPieceTheme] = useState<PieceTheme>(() => {
        const saved = localStorage.getItem('gambit_piece_theme');
        return (saved as PieceTheme) || DEFAULT_STATE.pieceTheme;
    });

    const [appBackground, setAppBackground] = useState<AppBackground>(() => {
        const saved = localStorage.getItem('gambit_app_background');
        return (saved as AppBackground) || DEFAULT_STATE.appBackground;
    });

    useEffect(() => {
        localStorage.setItem('gambit_board_theme', boardTheme);
    }, [boardTheme]);

    useEffect(() => {
        localStorage.setItem('gambit_piece_theme', pieceTheme);
    }, [pieceTheme]);

    useEffect(() => {
        localStorage.setItem('gambit_app_background', appBackground);

        // Apply global background
        const root = document.getElementById('root');
        if (root) {
            // Remove all existing app-bg- classes to prevent stacking or conflicts
            root.classList.remove('app-bg-dark', 'app-bg-light', 'app-bg-space', 'app-bg-nature', 'app-bg-abstract');

            // Add global classes
            root.classList.add('min-h-screen', 'font-sans', 'selection:bg-blue-500/30', `app-bg-${appBackground}`);
        }
    }, [appBackground]);

    return (
        <AppearanceContext.Provider value= {{
        boardTheme,
            pieceTheme,
            appBackground,
            setBoardTheme,
            setPieceTheme,
            setAppBackground
    }
}>
    { children }
    </AppearanceContext.Provider>
    );
}

export function useAppearance(): AppearanceState {
    const context = useContext(AppearanceContext);
    if (context === undefined) {
        throw new Error('useAppearance must be used within an AppearanceProvider');
    }
    return context;
}
