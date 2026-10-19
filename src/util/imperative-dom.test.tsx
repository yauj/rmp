import { MultiDirectedGraph } from 'graphology';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { LinePathType, LineStyleType } from '../constants/lines';
import { lineStyles } from '../components/svgs/lines/lines';
import { moveNodesAndRedrawLines } from './imperative-dom';
import { getLines } from './process-elements';

const buildGraph = (style: LineStyleType) => {
    const g = new MultiDirectedGraph() as any;
    g.addNode('misc_node_a', { visible: true, zIndex: 0, x: 0, y: 0, type: 'virtual', virtual: {} });
    g.addNode('misc_node_b', { visible: true, zIndex: 0, x: 100, y: 40, type: 'virtual', virtual: {} });
    g.addEdgeWithKey('line_1', 'misc_node_a', 'misc_node_b', {
        visible: true,
        zIndex: 0,
        type: LinePathType.Diagonal,
        [LinePathType.Diagonal]: { startFrom: 'from', offsetFrom: 0, offsetTo: 0, roundCornerFactor: 10 },
        style,
        [style]: structuredClone(lineStyles[style].defaultAttrs),
        reconcileId: '',
        parallelIndex: -1,
    });
    return g;
};

/** Renders the line the way the canvas does, into the document, and returns every path's d keyed by its position. */
const renderLine = (graph: any, style: LineStyleType) => {
    const line = getLines(graph).find(e => e.type === 'line')!;
    const Component = lineStyles[style].component as React.FC<any>;
    document.body.innerHTML = renderToStaticMarkup(
        <svg>
            <g id="line_1">
                <Component
                    id="line_1"
                    type={line.line!.attr.type}
                    path={line.line!.path}
                    styleAttrs={line.line!.attr[style]}
                    newLine={false}
                    handlePointerDown={() => {}}
                />
            </g>
        </svg>
    );
    return line.line!.path.d;
};
const pathDs = () => [...document.querySelectorAll('path')].map(p => p.getAttribute('d'));

afterEach(() => {
    document.body.innerHTML = '';
});

describe('imperative redraw while a node is pressed or dragged', () => {
    it.each([LineStyleType.YaujConstruction, LineStyleType.BjsubwayDotted, LineStyleType.YaujMetro])(
        'leaves a %s line as it is when the node does not move',
        style => {
            const graph = buildGraph(style);
            renderLine(graph, style);
            const before = pathDs();
            moveNodesAndRedrawLines(graph, ['misc_node_a'], 0, 0);
            expect(pathDs()).toEqual(before);
        }
    );

    it('keeps the dotted line clip an outline (not the centre line) while dragging', () => {
        const style = LineStyleType.YaujConstruction;
        const graph = buildGraph(style);
        const centre = renderLine(graph, style);
        graph.mergeNodeAttributes('misc_node_a', { x: 10, y: 0 });
        moveNodesAndRedrawLines(graph, ['misc_node_a'], 10, 0);
        const [main, clip] = pathDs();
        expect(main).not.toBe(centre);
        expect(clip).not.toBe(main); // the clip is the hollow outline, not a copy of the centre line
        expect(clip).toContain('Z');
    });
});
