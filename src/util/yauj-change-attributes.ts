import { MultiDirectedGraph } from 'graphology';
import { EdgeAttributes, GraphAttributes, NodeAttributes, StnId } from '../constants/constants';
import { NameOffsetX, NameOffsetY } from '../constants/stations';
import type { YaujStationKind } from '../components/svgs/stations/yauj-station';

export interface YaujStationChange {
    /** Only stations of this kind change; `any` (or undefined) changes every Yauj station. Needs `kind` to take effect. */
    kindFrom?: YaujStationKind | 'any';
    kind?: YaujStationKind;
    nameOffsetX?: NameOffsetX;
    nameOffsetY?: NameOffsetY;
    /** Icon rotation in degrees. */
    rotate?: number;
}

/**
 * Sets the station type, name offsets and / or icon rotation of Yauj stations in batch. Other station types are left alone.
 * Moving the name to an offset drops a hand-dragged name position (as the details panel does), otherwise the offset would
 * have no effect. Returns the stations that changed.
 */
export const changeYaujStationsInBatch = (
    graph: MultiDirectedGraph<NodeAttributes, EdgeAttributes, GraphAttributes>,
    stations: StnId[],
    change: YaujStationChange
): StnId[] => {
    const changed: StnId[] = [];
    stations.forEach(id => {
        if (!graph.hasNode(id) || graph.getNodeAttribute(id, 'type') !== 'yauj-station') return;
        const attrs = (graph.getNodeAttributes(id) as any)['yauj-station'];
        if (!attrs) return;
        if (change.kind && change.kindFrom && change.kindFrom !== 'any' && attrs.kind !== change.kindFrom) return;
        let touched = false;
        if (change.kind && attrs.kind !== change.kind) {
            attrs.kind = change.kind;
            delete attrs.preciseNameOffsets;
            touched = true;
        }
        if (change.nameOffsetX && attrs.nameOffsetX !== change.nameOffsetX) {
            attrs.nameOffsetX = change.nameOffsetX;
            delete attrs.preciseNameOffsets;
            touched = true;
        }
        if (change.nameOffsetY && attrs.nameOffsetY !== change.nameOffsetY) {
            attrs.nameOffsetY = change.nameOffsetY;
            delete attrs.preciseNameOffsets;
            touched = true;
        }
        if (change.rotate !== undefined && attrs.rotate !== change.rotate) {
            attrs.rotate = change.rotate;
            touched = true;
        }
        if (touched) changed.push(id);
    });
    return changed;
};
