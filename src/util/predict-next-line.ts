import { MultiDirectedGraph } from 'graphology';
import { EdgeAttributes, GraphAttributes, NodeAttributes, Theme } from '../constants/constants';
import { LinePathType, LineStyleType } from '../constants/lines';
import { AttributesWithColor, dynamicColorInjection } from '../components/panels/details/color-field';
import { lineStyles } from '../components/svgs/lines/lines';
import { canUseLineCombination } from './line-path-availability';

/** Where the predicted next line gets its style from. */
export type PredictNextLineSource = 'selected' | 'tool';

export interface PredictedLine {
    style: LineStyleType;
    attrs: Record<string, unknown>;
}

/** Styles that join two stations of one interchange or draw a border, so no line should continue from them. */
const NOT_CONTINUED = new Set<LineStyleType>([
    LineStyleType.YaujOsi,
    LineStyleType.YaujInterchange,
    LineStyleType.YaujBorder,
    LineStyleType.MTRPaidArea,
    LineStyleType.MTRUnpaidArea,
]);

/**
 * The style (with its attributes, e.g. colour) of the line that ends at this node: among the edges at the node, the
 * style + attributes that appear an odd number of times (a line passing through appears twice), most frequent first.
 */
export const getContinuingLine = (
    graph: MultiDirectedGraph<NodeAttributes, EdgeAttributes, GraphAttributes>,
    nodeId: string
): PredictedLine | undefined => {
    const counts = new Map<string, { line: PredictedLine; count: number }>();
    graph.forEachEdge(nodeId, (_, attr) => {
        const style = attr.style as LineStyleType;
        if (NOT_CONTINUED.has(style) || !lineStyles[style]) return;
        const styleAttrs = (attr as unknown as Record<string, Record<string, unknown>>)[style] ?? {};
        const key = JSON.stringify([style, styleAttrs]);
        const entry = counts.get(key) ?? { line: { style, attrs: structuredClone(styleAttrs) }, count: 0 };
        entry.count++;
        counts.set(key, entry);
    });
    let best: { line: PredictedLine; count: number } | undefined;
    for (const entry of counts.values()) {
        if (entry.count % 2 !== 0 && (!best || entry.count > best.count)) best = entry;
    }
    return best?.line;
};

/**
 * The line to draw from the predicted node. With `tool` the style last picked in the tools panel is used (in the
 * runtime colour where the style takes one); otherwise, or when that style cannot be drawn with `pathType`, the line
 * continues the style of the selected node's line, and finally falls back to a single colour line in the runtime colour.
 */
export const getPredictedLine = (
    graph: MultiDirectedGraph<NodeAttributes, EdgeAttributes, GraphAttributes>,
    nodeId: string,
    options: {
        source: PredictNextLineSource;
        toolStyle: LineStyleType | undefined;
        theme: Theme;
        pathType: LinePathType;
        mapEnabled: boolean;
        isSubscriber: boolean;
    }
): PredictedLine => {
    const { source, toolStyle, theme, pathType, mapEnabled, isSubscriber } = options;
    const usable = (style: LineStyleType) => canUseLineCombination(pathType, style, mapEnabled, isSubscriber);
    if (source === 'tool' && toolStyle && usable(toolStyle)) {
        const attrs = structuredClone(lineStyles[toolStyle].defaultAttrs) as Record<string, unknown>;
        if (dynamicColorInjection.has(toolStyle)) (attrs as unknown as AttributesWithColor).color = theme;
        return { style: toolStyle, attrs };
    }
    const continuing = getContinuingLine(graph, nodeId);
    if (continuing && usable(continuing.style)) return continuing;
    return { style: LineStyleType.SingleColor, attrs: { color: theme } };
};

export interface MirroredLine {
    /** Where the node at the far end of the mirrored line goes: as far from the selected node as the last line, in line. */
    x: number;
    y: number;
    /** The last line's diagonal shape, carried over unchanged, as the attributes of a line that starts at the selected node. */
    /** True when the straight continuation would sit on or next to a node the selected node connects to, so another direction was chosen. */
    turned: boolean;
    diagonal?: { startFrom: 'from' | 'to'; offsetFrom: number; offsetTo: number; roundCornerFactor: number };
}

/**
 * The last line drawn at a node (the one that continues, otherwise the last connecting line) turned half a circle
 * around the node: the next node sits at the same distance and direction, and a diagonal line keeps its shape
 * (the last line carried over as it is, offsets included, not turned).
 * When that spot is closer than one line length to a node the selected node already connects to (e.g. a station in the
 * middle of a line, where it is the other neighbour), the same distance is kept but the direction is turned in steps
 * of 45° to the spot furthest from all of them; the diagonal shape is then not copied.
 */
export const getLastLineMirror = (
    graph: MultiDirectedGraph<NodeAttributes, EdgeAttributes, GraphAttributes>,
    nodeId: string
): MirroredLine | undefined => {
    const continuing = getContinuingLine(graph, nodeId);
    const key = continuing && JSON.stringify([continuing.style, continuing.attrs]);
    let last: string | undefined;
    graph.forEachEdge(nodeId, (edge, attr) => {
        const style = attr.style as LineStyleType;
        if (NOT_CONTINUED.has(style) || !lineStyles[style]) return;
        const styleAttrs = (attr as unknown as Record<string, unknown>)[style] ?? {};
        if (!key || JSON.stringify([style, styleAttrs]) === key || !last) last = edge;
    });
    if (!last) return undefined;

    const [source, target] = graph.extremities(last);
    const other = source === nodeId ? target : source;
    const cur = graph.getNodeAttributes(nodeId);
    const prev = graph.getNodeAttributes(other);
    if (other === nodeId || (prev.x === cur.x && prev.y === cur.y)) return undefined;
    const [vx, vy] = [cur.x - prev.x, cur.y - prev.y];
    const length = Math.hypot(vx, vy);
    const neighbours = graph.neighbors(nodeId).map(id => graph.getNodeAttributes(id));
    const spot = (step: number) => {
        const angle = (step * Math.PI) / 4;
        return {
            x: cur.x + vx * Math.cos(angle) - vy * Math.sin(angle),
            y: cur.y + vx * Math.sin(angle) + vy * Math.cos(angle),
        };
    };
    const clearance = (p: { x: number; y: number }) =>
        Math.min(...neighbours.map(n => Math.hypot(n.x - p.x, n.y - p.y)));
    let step = 0;
    if (clearance(spot(0)) < length - 1e-6) {
        // 0, +45°, -45°, +90°, ... : the first of equally good spots is the one closest to straight on.
        const order = [0, 1, 7, 2, 6, 3, 5, 4];
        step = order.reduce((best, s) => (clearance(spot(s)) > clearance(spot(best)) + 1e-6 ? s : best), 0);
    }
    const mirrored: MirroredLine = { ...spot(step), turned: step !== 0 };

    const attr = graph.getEdgeAttributes(last);
    if (step === 0 && attr.type === LinePathType.Diagonal) {
        const d = structuredClone(attr[LinePathType.Diagonal]!);
        // The new line starts at this node. Its bent end follows the last line (read as running from the far node to
        // this one).
        const forward = source !== nodeId;
        mirrored.diagonal = {
            startFrom: forward ? d.startFrom : d.startFrom === 'from' ? 'to' : 'from',
            // The offset at the selected node carries on from the same end of the new line; the new node's end has none.
            offsetFrom: forward ? d.offsetTo : d.offsetFrom,
            offsetTo: 0,
            roundCornerFactor: d.roundCornerFactor,
        };
    }
    return mirrored;
};

/**
 * What a yauj station should look like when the line leading to it has this style: an in service station for metro,
 * rail and limited service lines, an under construction one for the construction style, and the small light rail
 * terminus (in the line colour) for light rail. Undefined for other styles.
 */
export const getYaujStationForLine = (
    line: PredictedLine
):
    | { kind: 'normal' | 'construction' | 'lightRailTerminus' | 'lightRailTerminusConstruction'; color?: Theme }
    | undefined => {
    const color = line.attrs.color as Theme | undefined;
    switch (line.style) {
        case LineStyleType.YaujMetro:
        case LineStyleType.YaujRail:
        case LineStyleType.YaujLimited:
            return { kind: 'normal' };
        case LineStyleType.YaujConstruction:
            return { kind: 'construction' };
        case LineStyleType.YaujLightRail:
            return { kind: 'lightRailTerminus', ...(color && { color }) };
        case LineStyleType.YaujLightRailConstruction:
            return { kind: 'lightRailTerminusConstruction', ...(color && { color }) };
        default:
            return undefined;
    }
};
