/**
 * Yauj branch: a dark canvas that is separate from the app's own dark mode. Only the background of the canvas darkens; the
 * colours of the map stay as they are. It affects the screen only; exports keep the white background.
 */
export interface DarkCanvas {
    enabled: boolean;
    /** How light the canvas background is, in percent of white: 0 is black. */
    background: number;
}

export const defaultDarkCanvas: DarkCanvas = { enabled: false, background: 12 };

export const DARK_CANVAS_BACKGROUND_RANGE = [0, 50] as const;

/** Anything read back from storage, made safe to use (older saved settings had more fields). */
export const normalizeDarkCanvas = (value: Partial<DarkCanvas> | undefined): DarkCanvas => {
    const [min, max] = DARK_CANVAS_BACKGROUND_RANGE;
    const background = value?.background;
    return {
        enabled: value?.enabled === true,
        background:
            typeof background === 'number' && Number.isFinite(background)
                ? Math.min(max, Math.max(min, Math.round(background)))
                : defaultDarkCanvas.background,
    };
};

/** The canvas background; the colours drawn on it are not filtered. */
export const getDarkCanvasStyle = (darkCanvas: DarkCanvas): { backgroundColor: string; filter: string } => {
    const grey = Math.round(255 * (darkCanvas.background / 100));
    return { backgroundColor: `rgb(${grey}, ${grey}, ${grey})`, filter: 'none' };
};
