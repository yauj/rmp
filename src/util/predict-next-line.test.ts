import { MultiDirectedGraph } from 'graphology';
import { describe, expect, it } from 'vitest';
import { LinePathType, LineStyleType } from '../constants/lines';
import { getContinuingLine, getLastLineMirror, getPredictedLine, getYaujStationForLine } from './predict-next-line';

const A = ['c', 'a', '#111', '#fff'];
const B = ['c', 'b', '#222', '#fff'];
const THEME = ['c', 't', '#333', '#fff'] as any;

const edge = (style: string, attrs: object) => ({ style, visible: true, [style]: attrs }) as any;
const build = (edges: [string, string, any][]) => {
    const g = new MultiDirectedGraph() as any;
    edges.forEach(([s, t, attr], i) => {
        [s, t].forEach(n => g.hasNode(n) || g.addNode(n, { x: 0, y: 0 }));
        g.addEdgeWithKey(`line_${i}`, s, t, attr);
    });
    return g;
};
const options = {
    source: 'selected' as const,
    toolStyle: undefined,
    theme: THEME,
    pathType: LinePathType.Diagonal,
    mapEnabled: false,
    isSubscriber: true,
};

describe('predict next line', () => {
    it('continues the style of the line that ends at the node', () => {
        const g = build([
            ['a', 'n', edge('yauj-rail', { colorBackground: A, colorForeground: B })],
            ['n', 'b', edge('yauj-rail', { colorBackground: A, colorForeground: B })],
            ['n', 'c', edge('yauj-construction', { color: B })],
        ]);
        expect(getContinuingLine(g, 'n')).toEqual({ style: 'yauj-construction', attrs: { color: B } });
        const g2 = build([['a', 'n', edge('yauj-metro', { color: A })]]);
        expect(getContinuingLine(g2, 'n')).toEqual({ style: 'yauj-metro', attrs: { color: A } });
    });

    it('ignores interchange connectors and passing lines', () => {
        const g = build([
            ['a', 'n', edge('yauj-metro', { color: A })],
            ['n', 'b', edge('yauj-metro', { color: A })],
            ['n', 'x', edge('yauj-osi', {})],
        ]);
        expect(getContinuingLine(g, 'n')).toBeUndefined();
    });

    it('falls back to a single colour line in the runtime colour', () => {
        const g = build([
            ['a', 'n', edge('yauj-metro', { color: A })],
            ['n', 'b', edge('yauj-metro', { color: A })],
        ]);
        expect(getPredictedLine(g, 'n', options)).toEqual({
            style: LineStyleType.SingleColor,
            attrs: { color: THEME },
        });
    });

    it('uses the style picked in the tools panel when asked to', () => {
        const g = build([['a', 'n', edge('yauj-metro', { color: A })]]);
        const picked = getPredictedLine(g, 'n', {
            ...options,
            source: 'tool',
            toolStyle: LineStyleType.YaujConstruction,
        });
        expect(picked.style).toBe('yauj-construction');
        expect((picked.attrs as any).color).toEqual(THEME);
        // nothing picked yet: keep following the selected line
        expect(getPredictedLine(g, 'n', { ...options, source: 'tool' }).style).toBe('yauj-metro');
        // 'selected' ignores the tool
        expect(getPredictedLine(g, 'n', { ...options, toolStyle: LineStyleType.YaujConstruction }).style).toBe(
            'yauj-metro'
        );
    });
});

describe('last line mirror', () => {
    const at = (g: any, id: string, x: number, y: number) => g.mergeNodeAttributes(id, { x, y });
    const diag = (startFrom: string, offsetFrom = 0, offsetTo = 0) =>
        ({
            style: 'yauj-metro',
            type: 'diagonal',
            diagonal: { startFrom, offsetFrom, offsetTo, roundCornerFactor: 7 },
            'yauj-metro': { color: A },
        }) as any;

    it('puts the next node as far away as the last line, in line', () => {
        const g = build([['a', 'n', diag('from')]]);
        at(g, 'a', 0, 0);
        at(g, 'n', 30, 40);
        expect(getLastLineMirror(g, 'n')).toMatchObject({ x: 60, y: 80, turned: false });
        expect(getLastLineMirror(build([['a', 'n', edge('yauj-osi', {})]]), 'n')).toBeUndefined();
    });

    it('keeps the diagonal shape: bent end follows the turned line', () => {
        // a -> n: the offset at n carries on, the new end has none
        const g = build([['a', 'n', diag('from', 2, 3)]]);
        at(g, 'a', 0, 0);
        at(g, 'n', 30, 40);
        expect(getLastLineMirror(g, 'n')!.diagonal).toEqual({
            startFrom: 'from',
            offsetFrom: 3,
            offsetTo: 0,
            roundCornerFactor: 7,
        });
        // n -> a ('to', 2, 3): the offset at n is the 'from' one
        const g2 = build([['n', 'a', diag('to', 2, 3)]]);
        at(g2, 'a', 0, 0);
        at(g2, 'n', 30, 40);
        expect(getLastLineMirror(g2, 'n')!.diagonal).toEqual({
            startFrom: 'from',
            offsetFrom: 2,
            offsetTo: 0,
            roundCornerFactor: 7,
        });
        // a -> n, 'to' stays 'to'
        const g3 = build([['a', 'n', diag('to')]]);
        at(g3, 'a', 0, 0);
        at(g3, 'n', 30, 40);
        expect(getLastLineMirror(g3, 'n')!.diagonal!.startFrom).toBe('to');
    });
});

describe('last line mirror with a node on the far side', () => {
    it('turns away from a node the straight continuation would land on', () => {
        // a ---- n ---- b along x: straight on from either side hits the other one
        const g = build([
            ['a', 'n', edge('yauj-metro', { color: A })],
            ['n', 'b', edge('yauj-metro', { color: A })],
        ]);
        [
            ['a', 0, 0],
            ['n', 100, 0],
            ['b', 200, 0],
        ].forEach(([id, x, y]) => g.mergeNodeAttributes(id, { x, y }));
        const m = getLastLineMirror(g, 'n')!;
        expect(m.turned).toBe(true);
        expect(m.diagonal).toBeUndefined();
        expect(Math.hypot(m.x - 100, m.y)).toBeCloseTo(100); // same length
        expect(Math.abs(m.x - 100)).toBeLessThan(1e-6); // straight up or down, furthest from both
        expect(Math.abs(m.y)).toBeCloseTo(100);
    });
});

describe('station for a line', () => {
    it('follows the line style', () => {
        const line = (style: string, attrs = {}) => ({ style, attrs }) as any;
        expect(getYaujStationForLine(line('yauj-metro', { color: A }))).toEqual({ kind: 'normal' });
        expect(getYaujStationForLine(line('yauj-rail'))).toEqual({ kind: 'normal' });
        expect(getYaujStationForLine(line('yauj-construction', { color: A }))).toEqual({ kind: 'construction' });
        expect(getYaujStationForLine(line('yauj-light-rail', { color: A }))).toEqual({
            kind: 'lightRailTerminus',
            color: A,
        });
        expect(getYaujStationForLine(line('yauj-light-rail-construction', { color: B }))).toEqual({
            kind: 'lightRailTerminusConstruction',
            color: B,
        });
        expect(getYaujStationForLine(line('single-color', { color: A }))).toBeUndefined();
    });
});
