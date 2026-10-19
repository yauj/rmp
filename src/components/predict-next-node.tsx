import rmgRuntime from '@railmapgen/rmg-runtime';
import { nanoid } from 'nanoid';
import React from 'react';
import { EdgeAttributes, Events, LineId, NodeAttributes, NodeId, NodeType, Theme } from '../constants/constants';
import { LinePathType, LineStyleComponentProps } from '../constants/lines';
import { MiscNodeType } from '../constants/nodes';
import { ExternalStationAttributes, STATION_TYPE_VALUES, StationAttributes, StationType } from '../constants/stations';
import { useRootDispatch, useRootSelector } from '../redux';
import { saveGraph } from '../redux/param/param-slice';
import {
    refreshEdgesThunk,
    refreshNodesThunk,
    setActive,
    setPointerPosition,
    setSelected,
} from '../redux/runtime/runtime-slice';
import { getMousePosition } from '../util/helpers';
import { supportsParallelLinePath } from '../util/parallel';
import {
    getLastLineMirror,
    getPredictedLine,
    getYaujStationForLine,
    MirroredLine,
    PredictedLine,
} from '../util/predict-next-line';
import { useMakeStationName } from '../util/random-station-names';
import { AttributesWithColor, dynamicColorInjection } from './panels/details/color-field';
import { lineStyles, normalizeEdgeAttributes } from './svgs/lines/lines';
import bezierPath from './svgs/lines/paths/bezier';
import { initializeBezierEndpointOffsets } from './svgs/lines/paths/bezier-endpoint';
import diagonalPath from './svgs/lines/paths/diagonal';
import miscNodes from './svgs/nodes/misc-nodes';
import virtual from './svgs/nodes/virtual';
import stations from './svgs/stations/stations';

const VirtualNodeComponent = virtual.component;
const OFFSET = 10;
type PredictionPathType = LinePathType.Diagonal | LinePathType.Bezier;

const makePredictionEdgeAttrs = (
    pathType: PredictionPathType,
    startFrom: 'from' | 'to',
    line: PredictedLine,
    diagonal?: MirroredLine['diagonal']
): EdgeAttributes =>
    ({
        visible: true,
        zIndex: 0,
        type: pathType,
        [pathType]:
            pathType === LinePathType.Diagonal
                ? { ...structuredClone(diagonalPath.defaultAttrs), startFrom, ...diagonal }
                : structuredClone(bezierPath.defaultAttrs),
        style: line.style,
        [line.style]: structuredClone(line.attrs),
        reconcileId: '',
        parallelIndex: -1,
    }) as EdgeAttributes;

/** A yauj station follows the line that leads to it: in service, under construction or light rail terminus. */
const followLine = (stationType: StationType, attrs: object, line: PredictedLine) => {
    if (stationType !== StationType.Yauj) return;
    const station = getYaujStationForLine(line);
    if (station) Object.assign(attrs, structuredClone(station));
};

/** Resets the interchange list of copied station attributes to what a new station starts with. */
const clearInterchanges = (stationType: StationType, attrs: object) => {
    if (!('transfer' in attrs)) return;
    (attrs as { transfer: unknown }).transfer = structuredClone(
        (stations[stationType].defaultAttrs as { transfer?: unknown }).transfer ?? [[]]
    );
};

const PredictNextNode = () => {
    const dispatch = useRootDispatch();
    const refreshAndSave = () => {
        dispatch(saveGraph(window.graph.export()));
        dispatch(refreshNodesThunk());
        dispatch(refreshEdgesThunk());
    };
    const { activeSubscriptions } = useRootSelector(state => state.account);
    const {
        telemetry: { project: isAllowProjectTelemetry },
        preference: { autoParallel, randomStationsNames, predictNextLineSource },
    } = useRootSelector(state => state.app);
    const {
        selected,
        theme: runtimeTheme,
        count: { mostFrequentStationType },
        lastTool,
        lastLineStyle,
    } = useRootSelector(state => state.runtime);
    const mapEnabled = useRootSelector(state => state.param.present.mapEnabled);
    const isSubscriber = activeSubscriptions.RMP_CLOUD;
    const predictionPathType: PredictionPathType = mapEnabled ? LinePathType.Bezier : LinePathType.Diagonal;
    const makeStationName = useMakeStationName();

    // must have exactly one selected, checked in the parent component
    const selectedID = selected.keys().next().value!;
    // check if the selectedID is a node
    if (!selectedID.startsWith('stn') && !selectedID.startsWith('misc_node')) return undefined;
    // TODO: remove selectedID if it is not existed in redo/undo
    if (!window.graph.hasNode(selectedID)) return undefined;

    const neighbors = window.graph.neighbors(selectedID);
    if (neighbors.length === 0) return undefined;

    const curPos = window.graph.getNodeAttributes(selectedID);
    const sumPos = neighbors.reduce(
        (acc, id) => {
            const attr = window.graph.getNodeAttributes(id);
            return {
                x: acc.x + attr.x,
                y: acc.y + attr.y,
            };
        },
        { x: 0, y: 0 }
    );
    const avgPos = {
        x: sumPos.x / neighbors.length,
        y: sumPos.y / neighbors.length,
    };
    const deltaPos = {
        x: curPos.x - avgPos.x,
        y: curPos.y - avgPos.y,
    };
    const nextPos = {
        x: curPos.x + deltaPos.x,
        y: curPos.y + deltaPos.y,
    };
    const sameSign = Math.sign(deltaPos.x) === Math.sign(deltaPos.y);
    // The station continues the last line: same distance, same direction and, for a diagonal line, same shape.
    // If that spot is taken by a node the selected node connects to, it moves to the furthest free direction.
    // The virtual node keeps its own curved placement beside it, unless the station had to turn away.
    const mirror = getLastLineMirror(window.graph, selectedID);
    const nextPos1 = mirror?.turned
        ? { x: mirror.x - OFFSET, y: mirror.y + OFFSET * (sameSign ? 1 : -1) }
        : {
              x: nextPos.x - OFFSET,
              y: nextPos.y + OFFSET * (sameSign ? 1 : -1),
          };
    const nextPos2 = mirror ?? {
        x: nextPos.x + OFFSET,
        y: nextPos.y + OFFSET * (sameSign ? -1 : 1),
    };

    const predictedLine = getPredictedLine(window.graph, selectedID, {
        source: predictNextLineSource,
        toolStyle: lastLineStyle,
        theme: runtimeTheme,
        pathType: predictionPathType,
        mapEnabled,
        isSubscriber,
    });
    const LineStyleComponent = lineStyles[predictedLine.style].component as React.FC<LineStyleComponentProps<any>>;

    const isSelectedStation = selectedID.startsWith('stn_');
    const stationType = isSelectedStation
        ? (window.graph.getNodeAttribute(selectedID, 'type') as StationType)
        : lastTool?.startsWith('station-')
          ? (lastTool.slice(8) as StationType)
          : mostFrequentStationType;
    const StationComponent = stations[stationType].component;
    const stationAttrs: NodeAttributes = {
        visible: true,
        zIndex: 0,
        x: nextPos2.x,
        y: nextPos2.y,
        type: stationType,
        [stationType]: structuredClone(stations[stationType].defaultAttrs),
    };
    followLine(stationType, stationAttrs[stationType] as object, predictedLine);
    if (isSelectedStation) {
        const selectedStationAttrs = structuredClone(
            window.graph.getNodeAttribute(selectedID, stationType)
        ) as NonNullable<ExternalStationAttributes[typeof stationType]>;
        clearInterchanges(stationType, selectedStationAttrs);
        followLine(stationType, selectedStationAttrs, predictedLine);
        Object.assign(stationAttrs, { [stationType]: selectedStationAttrs } as Pick<
            ExternalStationAttributes,
            typeof stationType
        >);
    }

    const switchStartFrom =
        deltaPos.x > 0
            ? deltaPos.x > Math.abs(deltaPos.y)
                ? false
                : true
            : -deltaPos.x > Math.abs(deltaPos.y)
              ? true
              : false;
    const path1StartFrom = switchStartFrom ? 'from' : 'to';
    const path2StartFrom = switchStartFrom ? 'to' : 'from';
    let path1;
    let path2;
    if (predictionPathType === LinePathType.Bezier) {
        const bezierPreviewAttrs = initializeBezierEndpointOffsets(
            window.graph,
            selectedID as NodeId,
            undefined,
            makePredictionEdgeAttrs(predictionPathType, path1StartFrom, predictedLine)
        );
        path1 = bezierPath.generatePath(curPos.x, nextPos1.x, curPos.y, nextPos1.y, bezierPreviewAttrs);
        path2 = bezierPath.generatePath(curPos.x, nextPos2.x, curPos.y, nextPos2.y, bezierPreviewAttrs);
    } else {
        path1 = diagonalPath.generatePath(curPos.x, nextPos1.x, curPos.y, nextPos1.y, {
            ...structuredClone(diagonalPath.defaultAttrs),
            startFrom: path1StartFrom,
        });
        path2 = diagonalPath.generatePath(curPos.x, nextPos2.x, curPos.y, nextPos2.y, {
            ...structuredClone(diagonalPath.defaultAttrs),
            startFrom: path2StartFrom,
            ...mirror?.diagonal,
        });
    }

    const handlePointerDown = async (nodeType: NodeType, e: React.PointerEvent<SVGElement>) => {
        e.stopPropagation();
        const { x, y } = getMousePosition(e);
        dispatch(setPointerPosition({ x, y }));

        const rand = nanoid(10);
        const isStation = STATION_TYPE_VALUES.has(nodeType as StationType);
        const nextID: NodeId = isStation ? `stn_${rand}` : `misc_node_${rand}`;

        // preserve attributes from the selected station if applicable
        const attr = structuredClone(
            isStation && nodeType === window.graph.getNodeAttribute(selectedID, 'type')
                ? window.graph.getNodeAttribute(selectedID, nodeType as StationType)
                : { ...stations, ...miscNodes }[nodeType].defaultAttrs
        );
        // the new station is not an interchange, whatever the selected one is
        if (isStation && nodeType === window.graph.getNodeAttribute(selectedID, 'type')) {
            clearInterchanges(nodeType as StationType, attr as object);
        }
        if (isStation) followLine(nodeType as StationType, attr as object, predictedLine);
        // inject runtime color if registered in dynamicColorInjection
        if (dynamicColorInjection.has(nodeType)) (attr as AttributesWithColor).color = runtimeTheme;
        // Override station names for non-default creation modes while keeping cloned names in default mode.
        const shouldOverrideStationNames =
            randomStationsNames !== 'default' && (randomStationsNames === 'empty' || activeSubscriptions.RMP_CLOUD);
        if (isStation && shouldOverrideStationNames) {
            (attr as StationAttributes).names = await makeStationName(nodeType as StationType);
        }

        window.graph.addNode(nextID, {
            visible: true,
            zIndex: 0,
            x: isStation ? nextPos2.x : nextPos1.x,
            y: isStation ? nextPos2.y : nextPos1.y,
            type: nodeType,
            [nodeType]: attr,
        });
        if (isAllowProjectTelemetry) rmgRuntime.event(Events.ADD_STATION, { type: nodeType });

        const pathType = predictionPathType;
        const newLineId: LineId = `line_${nanoid(10)}`;
        const [source, target] = [selectedID as NodeId, nextID];
        const parallelIndex = autoParallel && supportsParallelLinePath(pathType) ? 0 : -1;
        const startFrom = isStation ? path2StartFrom : path1StartFrom;
        const edgeAttrs = makePredictionEdgeAttrs(
            pathType,
            startFrom,
            predictedLine,
            isStation ? mirror?.diagonal : undefined
        );
        edgeAttrs.parallelIndex = parallelIndex;
        window.graph.addDirectedEdgeWithKey(newLineId, source, target, edgeAttrs);
        normalizeEdgeAttributes(window.graph, [newLineId], 'created');
        if (isAllowProjectTelemetry) rmgRuntime.event(Events.ADD_LINE, { type: pathType });

        refreshAndSave();
        dispatch(setActive(nextID));
        dispatch(setSelected(new Set([nextID])));
    };

    return (
        <g id="prediction" opacity="0.5" className="removeMe">
            <LineStyleComponent
                id="line_prediction_1"
                type={predictionPathType}
                path={path1}
                styleAttrs={predictedLine.attrs}
                newLine
                handlePointerDown={() => {}}
            />
            <LineStyleComponent
                id="line_prediction_2"
                type={predictionPathType}
                path={path2}
                styleAttrs={predictedLine.attrs}
                newLine
                handlePointerDown={() => {}}
            />
            <g transform={`translate(${nextPos1.x}, ${nextPos1.y})`}>
                <VirtualNodeComponent
                    id="misc_node_virtual_prediction_1"
                    attrs={{}}
                    x={nextPos1.x}
                    y={nextPos1.y}
                    handlePointerDown={(_, e) => {
                        handlePointerDown(MiscNodeType.Virtual, e);
                    }}
                    handlePointerMove={() => {}}
                    handlePointerUp={() => {}}
                />
            </g>
            <g transform={`translate(${nextPos2.x}, ${nextPos2.y})`}>
                <StationComponent
                    id="stn_virtual_prediction_2"
                    attrs={stationAttrs}
                    x={nextPos2.x}
                    y={nextPos2.y}
                    handlePointerDown={(_, e) => {
                        handlePointerDown(stationType, e);
                    }}
                    handlePointerMove={() => {}}
                    handlePointerUp={() => {}}
                />
            </g>
        </g>
    );
};

export default PredictNextNode;
