import { MultiDirectedGraph } from 'graphology';
import { describe, expect, it } from 'vitest';
import { makeOpenOnlyGraph } from './yauj-open-only';

const stn = (kind: string, transfer: string[][][] = [[]]) => ({
    type: 'yauj-station',
    visible: true,
    x: 0,
    y: 0,
    zIndex: 0,
    'yauj-station': { names: ['a', 'a'], kind, transfer },
});
const line = (style: string, colour: string[]) => ({ style, visible: true, [style]: { color: colour } });
const A = ['c', 'a', '#111', '#fff'];
const B = ['c', 'b', '#222', '#fff'];

const build = () => {
    const g = new MultiDirectedGraph();
    g.addNode('stn_1', stn('normal') as any);
    g.addNode(
        'stn_2',
        stn('normal', [
            [
                [...A, '', '', 'open'],
                [...B, '', '', 'construction'],
            ],
        ]) as any
    );
    g.addNode('stn_3', stn('construction') as any);
    g.addNode('stn_4', stn('normal', [[[...B, '', '', 'construction']]]) as any);
    g.addNode('stn_5', stn('normal') as any);
    g.addNode('misc_node_v', { type: 'virtual', x: 0, y: 0, visible: true, zIndex: 0, virtual: {} } as any);
    g.addNode('misc_node_b', {
        type: 'yauj-line-badge',
        x: 0,
        y: 0,
        visible: true,
        zIndex: 0,
        'yauj-line-badge': { color: B },
    } as any);
    g.addNode('misc_node_a', {
        type: 'yauj-line-badge',
        x: 0,
        y: 0,
        visible: true,
        zIndex: 0,
        'yauj-line-badge': { color: A },
    } as any);
    g.addEdgeWithKey('line_1', 'stn_1', 'stn_2', line('yauj-metro', A) as any);
    g.addEdgeWithKey('line_2', 'stn_2', 'stn_3', line('yauj-construction', B) as any);
    g.addEdgeWithKey('line_3', 'stn_3', 'stn_4', line('yauj-construction', B) as any);
    g.addEdgeWithKey('line_4', 'stn_2', 'stn_5', line('yauj-metro', A) as any);
    g.addEdgeWithKey('line_5', 'stn_3', 'misc_node_v', line('yauj-construction', B) as any);
    return g as any;
};

describe('makeOpenOnlyGraph', () => {
    it('keeps only what is in service and does not touch the input', () => {
        const input = build();
        const before = JSON.stringify(input.export());
        const { graph, stats } = makeOpenOnlyGraph(input);
        expect(JSON.stringify(input.export())).toBe(before);
        expect(graph.hasNode('stn_1')).toBe(true);
        expect(graph.hasNode('stn_3')).toBe(false); // under construction station, lines gone, deleted
        expect(graph.hasNode('stn_4')).toBe(false); // interchange of only construction lines
        expect(graph.hasNode('misc_node_v')).toBe(false);
        expect(graph.getNodeAttribute('stn_2', 'yauj-station' as any).transfer).toEqual([
            [
                [...A, '', '', 'open'],
                [...B, '', '', 'hidden'],
            ],
        ]);
        expect(graph.size).toBe(2);
        expect(stats.trimmedInterchanges).toBe(1);
    });

    it('turns a construction station on an open line into an invisible node', () => {
        const g = new MultiDirectedGraph() as any;
        g.addNode('stn_1', stn('normal') as any);
        g.addNode('stn_2', stn('construction') as any);
        g.addEdgeWithKey('line_1', 'stn_1', 'stn_2', line('yauj-metro', A) as any);
        const { graph } = makeOpenOnlyGraph(g);
        expect(graph.order).toBe(2);
        const [, other] = graph.extremities('line_1');
        expect(graph.getNodeAttribute(other, 'type')).toBe('virtual');
    });

    it('converts a construction station in the middle of an open line, keeps the legend flag', () => {
        const g = new MultiDirectedGraph() as any;
        g.addNode('stn_1', stn('normal') as any);
        g.addNode('stn_2', stn('closed') as any);
        g.addNode('stn_3', stn('normal') as any);
        g.addNode('misc_node_l', {
            type: 'yauj-legend',
            x: 0,
            y: 0,
            visible: true,
            zIndex: 0,
            'yauj-legend': {},
        } as any);
        g.addEdgeWithKey('line_1', 'stn_1', 'stn_2', line('yauj-metro', A) as any);
        g.addEdgeWithKey('line_2', 'stn_2', 'stn_3', line('yauj-metro', A) as any);
        const { graph } = makeOpenOnlyGraph(g);
        expect(graph.hasNode('stn_2')).toBe(false);
        expect(graph.order).toBe(4);
        expect(graph.size).toBe(2);
        expect(graph.getNodeAttribute('misc_node_l', 'yauj-legend' as any)).toEqual({ openOnly: true });
    });

    it('keeps a construction circle between two open lines (Pazhou)', () => {
        const g = new MultiDirectedGraph() as any;
        const transfer = [
            [
                [...A, '', '', 'open'],
                [...B, '', '', 'construction'],
                [...A, '', '', 'open'],
                [...B, '', '', 'closed'],
            ],
        ];
        g.addNode('stn_1', stn('normal', transfer) as any);
        const { graph } = makeOpenOnlyGraph(g);
        const kept = graph.getNodeAttribute('stn_1', 'yauj-station' as any).transfer[0].map((i: string[]) => i[6]);
        expect(kept).toEqual(['open', 'construction', 'open', 'hidden']);
    });
});
