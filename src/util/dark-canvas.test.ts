import { describe, expect, it } from 'vitest';
import { defaultDarkCanvas, getDarkCanvasStyle, normalizeDarkCanvas } from './dark-canvas';

describe('dark canvas', () => {
    it('darkens only the background, without filtering the colours drawn on it', () => {
        expect(getDarkCanvasStyle({ enabled: true, background: 10 })).toEqual({
            backgroundColor: 'rgb(26, 26, 26)',
            filter: 'none',
        });
        expect(getDarkCanvasStyle({ enabled: true, background: 0 }).backgroundColor).toBe('rgb(0, 0, 0)');
    });

    it('makes stored values safe and drops the fields of older settings', () => {
        expect(normalizeDarkCanvas(undefined)).toEqual(defaultDarkCanvas);
        expect(normalizeDarkCanvas({ enabled: true, background: 500 })).toEqual({ enabled: true, background: 50 });
        expect(normalizeDarkCanvas({ enabled: true, background: -5, brightness: 90 } as any)).toEqual({
            enabled: true,
            background: 0,
        });
        expect(normalizeDarkCanvas({ enabled: 'yes' as any, background: NaN })).toEqual(defaultDarkCanvas);
    });
});
