import { describe, expect, it } from 'vitest';
import { findMapDate, getYaujDefaultRegion, setYaujLoadedName, yaujBaseName } from './yauj-export';

const graphOf = (nodes: Record<string, any>) => ({
    forEachNode: (cb: (id: string, attr: any) => void) => Object.entries(nodes).forEach(([id, a]) => cb(id, a)),
});

describe('yauj export naming', () => {
    it('defaults the region from the last opened file', () => {
        setYaujLoadedName(undefined);
        expect(getYaujDefaultRegion()).toBe('');
        setYaujLoadedName('RailMapToolkit_PearlRiverDelta_20260731.json');
        expect(getYaujDefaultRegion()).toBe('PearlRiverDelta');
        setYaujLoadedName('mymap.json');
        expect(getYaujDefaultRegion()).toBe('mymap');
    });

    it('reads the date from the map title text', () => {
        const g = graphOf({
            a: { type: 'text', text: { content: 'Pearl River Delta' } },
            b: { type: 'text', text: { content: '(2026-07-31)' } },
        });
        expect(findMapDate(g)).toBe('20260731');
        expect(findMapDate(graphOf({ a: { type: 'text', text: { content: 'x' } } }))).toBeUndefined();
    });

    it('builds the base name', () => {
        expect(yaujBaseName('PearlRiverDelta', '20260731')).toBe('RailMapToolkit_PearlRiverDelta_20260731');
    });
});
