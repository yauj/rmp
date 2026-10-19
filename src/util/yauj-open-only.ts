import { MultiDirectedGraph } from 'graphology';
import { nanoid } from 'nanoid';
import { EdgeAttributes, GraphAttributes, NodeAttributes } from '../constants/constants';

type YaujGraph = MultiDirectedGraph<NodeAttributes, EdgeAttributes, GraphAttributes>;

/** Line styles that only draw something not yet in service. */
const NOT_OPEN_STYLES = new Set(['yauj-construction', 'yauj-light-rail-construction']);
/** Line styles that connect two stations of one interchange; they make no sense once either end is gone. */
const CONNECTOR_STYLES = new Set(['yauj-osi', 'yauj-interchange']);
/** Station kinds that are never in service. */
const NOT_OPEN_KINDS = new Set(['construction', 'closed', 'lightRailTerminusConstruction']);

const isNotOpenStatus = (info: string[]) => info[6] === 'closed' || info[6] === 'construction';

export interface OpenOnlyStats {
    removedLines: number;
    removedStations: number;
    convertedToNodes: number;
    removedNodes: number;
    trimmedInterchanges: number;
}

/**
 * Returns a copy of a yauj map showing only what is in service today; the input graph is not touched.
 * - Under construction line styles are dropped.
 * - Under construction / closed stations, and interchanges whose lines are all closed or under construction, become
 *   invisible nodes, so the open lines still run through the same point.
 * - Interchanges that keep at least one open line have their closed / under construction circles hidden (the slot stays, so the layout does not move).
 * - Nodes and stations that lost every line are deleted.
 * - An interchange keeps a closed / under construction circle that sits between two open ones (Pazhou).
 * - Legends are switched to their open-only version.
 */
export const makeOpenOnlyGraph = (graph: YaujGraph): { graph: YaujGraph; stats: OpenOnlyStats } => {
    const g: YaujGraph = new MultiDirectedGraph();
    g.import(structuredClone(graph.export()));
    const stats: OpenOnlyStats = {
        removedLines: 0,
        removedStations: 0,
        convertedToNodes: 0,
        removedNodes: 0,
        trimmedInterchanges: 0,
    };

    // Only nodes that were attached to something are removed when they end up alone.
    const hadEdges = new Set<string>();
    g.forEachNode(node => {
        if (g.degree(node) > 0) hadEdges.add(node);
    });

    g.filterEdges((_, attr) => NOT_OPEN_STYLES.has(attr.style)).forEach(edge => {
        g.dropEdge(edge);
        stats.removedLines++;
    });

    // Stations that are not in service, and the replacement nodes.
    const toNode: string[] = [];
    g.forEachNode((node, attr) => {
        if (attr.type !== 'yauj-station') return;
        const station = (attr as any)['yauj-station'];
        const groups: string[][][] = station.transfer ?? [];
        const infos = groups.flat();
        const notOpen = NOT_OPEN_KINDS.has(station.kind) || (infos.length > 0 && infos.every(isNotOpenStatus));
        if (notOpen) {
            toNode.push(node);
            return;
        }
        // A closed / under construction circle between two open ones is an out-of-station interchange (e.g. Pazhou):
        // it stays, everything else not in service is trimmed.
        const keep = (group: string[][], i: number) =>
            !isNotOpenStatus(group[i]) ||
            (group.slice(0, i).some(info => !isNotOpenStatus(info)) &&
                group.slice(i + 1).some(info => !isNotOpenStatus(info)));
        if (groups.some(group => group.some((_, i) => !keep(group, i)))) {
            // Hide the circle instead of removing it, so the rest of the interchange keeps its layout.
            station.transfer = groups.map(group =>
                group.map((info, i) => (keep(group, i) ? info : [...info.slice(0, 6), 'hidden', ...info.slice(7)]))
            );
            stats.trimmedInterchanges++;
        }
    });

    toNode.forEach(station => {
        const { x, y, zIndex, visible } = g.getNodeAttributes(station);
        const edges = g.edges(station).map(edge => ({
            key: edge,
            source: g.source(edge),
            target: g.target(edge),
            attr: g.getEdgeAttributes(edge),
        }));
        g.dropNode(station);
        const id = `misc_node_${nanoid(10)}`;
        g.addNode(id, { x, y, zIndex, visible, type: 'virtual', virtual: {} } as NodeAttributes);
        edges.forEach(({ key, source, target, attr }) => {
            if (CONNECTOR_STYLES.has(attr.style)) {
                stats.removedLines++;
                return;
            }
            g.addEdgeWithKey(key, source === station ? id : source, target === station ? id : target, attr);
        });
        hadEdges.add(id);
        stats.convertedToNodes++;
    });

    // Connectors left dangling because one end was an under construction station that has since been deleted are
    // already gone; now drop nodes that lost every line.
    g.forEachNode(node => {
        if (!hadEdges.has(node) || g.degree(node) > 0) return;
        const type = g.getNodeAttribute(node, 'type');
        if (type === 'virtual') stats.removedNodes++;
        else if (type === 'yauj-station') stats.removedStations++;
        else return;
        g.dropNode(node);
    });

    // The legend drops the styles that are no longer on the map.
    g.forEachNode((_, attr) => {
        if (attr.type === 'yauj-legend')
            (attr as any)['yauj-legend'] = { ...(attr as any)['yauj-legend'], openOnly: true };
    });

    return { graph: g, stats };
};
