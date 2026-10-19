import { MultiDirectedGraph } from 'graphology';
import { describe, expect, it } from 'vitest';
import { changeYaujStationsInBatch } from './yauj-change-attributes';

const build = () => {
    const g = new MultiDirectedGraph() as any;
    const stn = (id: string, type: string, extra: object = {}) =>
        g.addNode(id, {
            x: 0,
            y: 0,
            type,
            [type]: {
                kind: 'normal',
                nameOffsetX: 'right',
                nameOffsetY: 'top',
                preciseNameOffsets: { x: 1, y: 2 },
                ...extra,
            },
        });
    stn('stn_a', 'yauj-station');
    stn('stn_b', 'yauj-station', { kind: 'construction' });
    stn('stn_c', 'mtr', { kind: undefined });
    return g;
};

describe('changeYaujStationsInBatch', () => {
    it('changes the station type, optionally only from one type', () => {
        const g = build();
        expect(
            changeYaujStationsInBatch(g, ['stn_a', 'stn_b'] as any, { kindFrom: 'construction', kind: 'closed' })
        ).toEqual(['stn_b']);
        expect(g.getNodeAttribute('stn_b', 'yauj-station').kind).toBe('closed');
        expect(g.getNodeAttribute('stn_a', 'yauj-station').kind).toBe('normal');
        changeYaujStationsInBatch(g, ['stn_a', 'stn_b'] as any, { kind: 'lineColor' });
        expect(g.getNodeAttribute('stn_a', 'yauj-station').kind).toBe('lineColor');
        expect(g.getNodeAttribute('stn_b', 'yauj-station').kind).toBe('lineColor');
    });

    it('sets the name offsets, drops a dragged name position and leaves other station types alone', () => {
        const g = build();
        const changed = changeYaujStationsInBatch(g, ['stn_a', 'stn_c'] as any, {
            nameOffsetX: 'left',
            nameOffsetY: 'middle',
        });
        expect(changed).toEqual(['stn_a']);
        const a = g.getNodeAttribute('stn_a', 'yauj-station');
        expect([a.nameOffsetX, a.nameOffsetY, a.preciseNameOffsets]).toEqual(['left', 'middle', undefined]);
        expect(g.getNodeAttribute('stn_c', 'mtr').nameOffsetX).toBe('right');
    });

    it('reports nothing when nothing changes', () => {
        const g = build();
        expect(changeYaujStationsInBatch(g, ['stn_a'] as any, { kind: 'normal', nameOffsetX: 'right' })).toEqual([]);
        expect(g.getNodeAttribute('stn_a', 'yauj-station').preciseNameOffsets).toEqual({ x: 1, y: 2 });
    });
});

describe('changeYaujStationsInBatch rotation', () => {
    it('sets the icon rotation and keeps a dragged name position', () => {
        const g = new MultiDirectedGraph() as any;
        g.addNode('stn_a', {
            x: 0,
            y: 0,
            type: 'yauj-station',
            'yauj-station': { kind: 'normal', rotate: 0, preciseNameOffsets: { x: 1, y: 2 } },
        });
        expect(changeYaujStationsInBatch(g, ['stn_a'] as any, { rotate: 135 })).toEqual(['stn_a']);
        expect(g.getNodeAttribute('stn_a', 'yauj-station')).toMatchObject({
            rotate: 135,
            preciseNameOffsets: { x: 1, y: 2 },
        });
        expect(changeYaujStationsInBatch(g, ['stn_a'] as any, { rotate: 135 })).toEqual([]);
        expect(changeYaujStationsInBatch(g, ['stn_a'] as any, { rotate: 0 })).toEqual(['stn_a']);
    });
});
