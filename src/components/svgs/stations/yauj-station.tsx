import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { MonoColour } from '@railmapgen/rmg-palette-resources';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SameStyleLineEndpointOverlay } from '../common/same-style-line-endpoint-overlay';
import { AttrsProps, CanvasType, CategoriesType, CityCode } from '../../../constants/constants';
import {
    defaultStationAttributes,
    NameOffsetX,
    NameOffsetY,
    Rotate,
    Station,
    StationAttributes,
    StationComponentProps,
    StationType,
} from '../../../constants/stations';
import { getLangStyle, TextLanguage } from '../../../util/fonts';
import { NameLayout, useDraggableStationName } from '../../../util/use-draggable-station-name';
import { ColorAttribute, ColorField } from '../../panels/details/color-field';
import {
    InterchangeField,
    InterchangeInfo,
    StationAttributesWithInterchange,
} from '../../panels/details/interchange-field';
import { NameOffsetPad } from '../../panels/details/name-offset-pad';
import { RotateField } from '../../panels/details/rotate-field';
import { MultilineText, NAME_DY } from '../common/multiline-text';
import { YAUJ_LIGHT_RAIL_COLOR } from '../../../constants/yauj-colors';
import { LINE_WIDTH, R } from './mtr';

/**
 * - `normal`: the Hong Kong MTR station. Each interchange line has a status (see `YaujLineStatus`), which decides how
 *   its circle is drawn: open lines share a pill, terminus lines get a border in the line colour, closed and
 *   under-construction lines are dotted circles.
 * - `construction` / `closed`: the Beijing dotted station. The name is hidden and replaced by the Beijing status
 *   label with an English line below it.
 * - `lineColor`: a Hong Kong sized terminus whose border is in the line colour (e.g. where a limited service line
 *   simply ends early). The name is drawn like the Hong Kong station.
 * - `lightRailTerminus`: small light rail end station, for a light rail line whose end is not a metro/rail station.
 * - `lightRailTerminusConstruction`: the same small circle with a dotted border, for an expansion under construction.
 */
export type YaujStationKind =
    | 'normal'
    | 'construction'
    | 'closed'
    | 'lightRailTerminus'
    | 'lightRailTerminusConstruction'
    | 'lineColor';

/**
 * Status of one interchange line, stored as the seventh element (index 6) of its `InterchangeInfo`.
 */
export type YaujLineStatus = 'open' | 'terminus' | 'closed' | 'construction' | 'hidden';

export const YAUJ_LINE_STATUSES: YaujLineStatus[] = ['open', 'terminus', 'closed', 'construction'];

/**
 * `hidden` is not in the dropdown. The open-only export uses it for a closed / under construction line: its slot
 * still takes up room, so the other circles and the name stay where they were, but nothing is drawn for it.
 */
export const getLineStatus = (info: InterchangeInfo): YaujLineStatus =>
    [...YAUJ_LINE_STATUSES, 'hidden'].includes(info[6]) ? (info[6] as YaujLineStatus) : 'open';

const STATUS_LABELS: Record<'construction' | 'closed', [string, string]> = {
    construction: ['(施工封闭)', '(U/C)'],
    closed: ['(暂缓开通)', '(Closed)'],
};

const NAVY = '#001f50';
const DOTTED_R = R;
// Every circle overlaps its neighbour by the same amount; open circles are drawn over dotted ones.
const STEP = R;
const TERMINUS_R = 2.5;
const LABEL_FONT_SIZE = 5.2;
const LABEL_LINE_HEIGHT = 6;
const NAME_LINE_HEIGHT = {
    top: 7.5 + 1,
    middle: 0,
    bottom: 10 + 1,
};

interface TextLine {
    text: string;
    fontSize: number;
    lineHeight: number;
    lang: TextLanguage;
}

/**
 * Where to put a block of text next to a small round marker. The group origin is the top of the block.
 */
const getBlockLayout = (
    offsetX: NameOffsetX,
    offsetY: NameOffsetY,
    markerR: number,
    blockHeight: number
): NameLayout => {
    const diagonal = offsetX !== 'middle' && offsetY !== 'middle';
    const gap = diagonal ? 0.5 : 2;
    const x =
        offsetY === 'middle'
            ? (offsetX === 'left' ? -1 : 1) * (markerR + gap)
            : offsetX === 'middle'
              ? 0
              : (offsetX === 'left' ? -1 : 1) * (markerR - (diagonal ? 2 : 1));
    const y =
        offsetY === 'top' ? -(markerR + gap + blockHeight) : offsetY === 'bottom' ? markerR + gap : -blockHeight / 2;
    return { x, y, anchor: offsetX === 'left' ? 'end' : offsetX === 'right' ? 'start' : 'middle' };
};

/**
 * The Hong Kong style station circles for a list of interchange lines, without any event handling: open and terminus
 * lines share a pill, closed and under-construction lines are dotted circles drawn underneath.
 */
export const YaujInterchangeGlyph = (props: { slots: { info: InterchangeInfo; status: YaujLineStatus }[] }) => {
    const { slots } = props;
    const isSolid = (status: YaujLineStatus) => status === 'open' || status === 'terminus';
    const positions = slots.map((_, i) => i * STEP);
    const solidCount = slots.filter(slot => isSolid(slot.status)).length;
    return (
        <>
            {slots.length === 0 && <circle r={R} fill="white" stroke={NAVY} strokeWidth="1.5" />}
            {/* Dotted circles for lines that are closed or under construction, behind the solid ones. The
            further a circle is from the first one, the lower it is drawn. */}
            {slots
                .map((slot, i) => ({ slot, i }))
                .reverse()
                .map(
                    ({ slot, i }) =>
                        !isSolid(slot.status) &&
                        slot.status !== 'hidden' && (
                            <circle
                                key={`dotted-${i}`}
                                cx={positions[i]}
                                r={R}
                                fill="white"
                                stroke="black"
                                strokeWidth="0.5"
                                strokeDasharray="1.5"
                            />
                        )
                )}
            {/* Borders first, then the white fills, so overlapping circles merge into one pill. */}
            {slots.map(
                (slot, i) =>
                    isSolid(slot.status) && (
                        <circle
                            key={`border-${i}`}
                            cx={positions[i]}
                            r={R}
                            fill="none"
                            stroke={slot.status === 'terminus' ? slot.info[2] : NAVY}
                            strokeWidth="1.5"
                        />
                    )
            )}
            {slots.map(
                (slot, i) =>
                    isSolid(slot.status) && <circle key={`fill-${i}`} cx={positions[i]} r={R - 0.75} fill="white" />
            )}
            {solidCount > 1 &&
                slots.map(
                    (slot, i) =>
                        isSolid(slot.status) && (
                            <line
                                key={`tick-${i}`}
                                x1={positions[i] - LINE_WIDTH / 2}
                                x2={positions[i] + LINE_WIDTH / 2}
                                stroke={slot.info[2]}
                                strokeWidth="2"
                            />
                        )
                )}
        </>
    );
};

const YaujStation = (props: StationComponentProps) => {
    const { id, attrs, handlePointerDown, handlePointerMove, handlePointerUp } = props;
    const {
        names = defaultStationAttributes.names,
        preciseNameOffsets = defaultStationAttributes.preciseNameOffsets,
        nameOffsetX = defaultYaujStationAttributes.nameOffsetX,
        nameOffsetY = defaultYaujStationAttributes.nameOffsetY,
        kind = defaultYaujStationAttributes.kind,
        transfer = defaultYaujStationAttributes.transfer,
        rotate = defaultYaujStationAttributes.rotate,
        color = defaultYaujStationAttributes.color,
    } = attrs[StationType.Yauj] ?? defaultYaujStationAttributes;

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerDown(id, e),
        [id, handlePointerDown]
    );
    const onPointerMove = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerMove(id, e),
        [id, handlePointerMove]
    );
    const onPointerUp = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerUp(id, e),
        [id, handlePointerUp]
    );

    const isNormal = kind === 'normal';
    const isDottedTerminus = kind === 'lightRailTerminusConstruction';
    const isTerminus = kind === 'lightRailTerminus' || isDottedTerminus;
    const isColored = kind === 'lineColor';
    // One circle per interchange line (a plain station is a single open circle). Neighbouring circles overlap into a
    // pill; open and terminus circles are drawn over the dotted (closed / under construction) ones.
    const slots = (transfer.at(0) ?? []).map(info => ({ info, status: getLineStatus(info) }));
    const isSolid = (status: YaujLineStatus) => status === 'open' || status === 'terminus';
    const positions = slots.map((_, i) => i * STEP);
    const lastX = positions.at(-1) ?? 0;
    const solidCount = slots.filter(slot => isSolid(slot.status)).length;

    // A station whose lines are all closed / under construction shows the status label instead of its name.
    const statusKind: 'construction' | 'closed' | undefined =
        kind === 'construction' || kind === 'closed'
            ? kind
            : isNormal && slots.length > 0 && solidCount === 0
              ? slots.every(slot => slot.status === 'closed')
                  ? 'closed'
                  : 'construction'
              : undefined;
    const hkName = (isNormal && !statusKind) || isColored;

    // Text lines for the status label. The light rail terminus has no label at all.
    const textLines: TextLine[] = [];
    if (statusKind) {
        const [zh, en] = STATUS_LABELS[statusKind];
        textLines.push(
            { text: zh, fontSize: LABEL_FONT_SIZE, lineHeight: LABEL_LINE_HEIGHT, lang: TextLanguage.mtr_zh },
            { text: en, fontSize: LABEL_FONT_SIZE, lineHeight: LABEL_LINE_HEIGHT, lang: TextLanguage.mtr_en }
        );
    }
    const blockHeight = textLines.reduce((sum, line) => sum + line.lineHeight, 0);
    const markerR = isTerminus ? TERMINUS_R : DOTTED_R;

    let defaultNameLayout: NameLayout;
    if (hkName) {
        const iconX = Math.cos((rotate * Math.PI) / 180) * lastX;
        const iconY = Math.sin((rotate * Math.PI) / 180) * lastX;
        // Slanted labels (e.g. top right) tuck in closer to the circle than the straight ones.
        const diagonal = nameOffsetX !== 'middle' && nameOffsetY !== 'middle';
        const textGap = diagonal ? 5 : 8;
        const textDX = nameOffsetX === 'left' ? -textGap : nameOffsetX === 'right' ? textGap : 0;
        // if icon grows the same direction of the text, add the extra icon length to text
        const textX = Math.sign(iconX) === Math.sign(textDX) ? iconX + textDX : textDX;
        const textDY =
            (names[NAME_DY[nameOffsetY].namesPos].split('\n').length * NAME_LINE_HEIGHT[nameOffsetY] +
                (diagonal ? 3 : 6)) *
            NAME_DY[nameOffsetY].polarity;
        const textY = Math.sign(iconY) === Math.sign(textDY) ? iconY + textDY : textDY;
        defaultNameLayout = {
            x: textX,
            y: textY,
            anchor: nameOffsetX === 'left' ? 'end' : nameOffsetX === 'right' ? 'start' : 'middle',
        };
    } else {
        defaultNameLayout = getBlockLayout(nameOffsetX, nameOffsetY, markerR, blockHeight);
        if (isNormal) {
            // The dotted circles grow along the rotation, push the label out of their way.
            const iconX = Math.cos((rotate * Math.PI) / 180) * lastX;
            const iconY = Math.sin((rotate * Math.PI) / 180) * lastX;
            if (Math.sign(iconX) === Math.sign(defaultNameLayout.x)) defaultNameLayout.x += iconX;
            if (Math.sign(iconY) === Math.sign(defaultNameLayout.y)) defaultNameLayout.y += iconY;
        }
    }
    const { canDrag, dragHandlers, previewPreciseNameOffsets } = useDraggableStationName<StationAttributes>(
        id,
        StationType.Yauj,
        defaultNameLayout
    );
    const nameLayout = previewPreciseNameOffsets ?? preciseNameOffsets ?? defaultNameLayout;

    return (
        <g>
            {isNormal && (
                <g transform={`rotate(${rotate})`}>
                    <YaujInterchangeGlyph slots={slots} />
                    {/* Below is an overlay element that has all event hooks but can not be seen. */}
                    <rect
                        id={`stn_core_${id}`}
                        x={-R}
                        y={-R}
                        width={lastX + 2 * R}
                        height={2 * R}
                        rx={R}
                        fill="white"
                        fillOpacity="0"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        style={{ cursor: 'move' }}
                        className="removeMe"
                    />
                </g>
            )}
            {!isNormal && (
                <circle
                    id={`stn_core_${id}`}
                    r={isColored ? R : markerR}
                    stroke={isColored || isTerminus ? color[2] : 'black'}
                    strokeWidth={isColored ? '1.5' : isTerminus ? '.8' : '0.5'}
                    strokeDasharray={isDottedTerminus ? '1 1' : isTerminus || isColored ? undefined : '1.5'}
                    fill="white"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    style={{ cursor: 'move' }}
                />
            )}
            <g
                id={`stn_name_${id}`}
                transform={`translate(${nameLayout.x}, ${nameLayout.y})`}
                textAnchor={nameLayout.anchor}
                className={hkName ? 'rmp-name-outline' : undefined}
                strokeWidth={hkName ? '1.25' : undefined}
                style={{ cursor: canDrag ? 'grab' : undefined }}
                {...dragHandlers}
            >
                {hkName ? (
                    <>
                        <MultilineText
                            text={names[0].split('\n')}
                            fontSize={10}
                            lineHeight={10}
                            grow="up"
                            baseOffset={1}
                            fill={NAVY}
                            {...getLangStyle(TextLanguage.mtr_zh)}
                        />
                        <MultilineText
                            text={(names[1] ?? '').split('\n')}
                            fontSize={7.5}
                            lineHeight={7.5}
                            grow="down"
                            baseOffset={1}
                            fill={NAVY}
                            {...getLangStyle(TextLanguage.mtr_en)}
                        />
                    </>
                ) : (
                    textLines.map((line, i) => (
                        <text
                            key={`${line.text}${i}`}
                            y={textLines.slice(0, i).reduce((sum, l) => sum + l.lineHeight, 0) + line.lineHeight / 2}
                            dominantBaseline="middle"
                            fontSize={line.fontSize}
                            {...getLangStyle(line.lang)}
                        >
                            {line.text}
                        </text>
                    ))
                )}
            </g>
        </g>
    );
};

/**
 * YaujStation specific props.
 */
export interface YaujStationAttributes extends StationAttributes, StationAttributesWithInterchange, ColorAttribute {
    nameOffsetX: NameOffsetX;
    nameOffsetY: NameOffsetY;
    rotate: Rotate;
    kind: YaujStationKind;
}

const defaultYaujStationAttributes: YaujStationAttributes = {
    names: ['車站', 'Stn'],
    nameOffsetX: 'right',
    nameOffsetY: 'top',
    rotate: 0,
    transfer: [[]] as InterchangeInfo[][],
    kind: 'normal',
    color: [...YAUJ_LIGHT_RAIL_COLOR],
};

const YaujStationAttrsComponent = (props: AttrsProps<YaujStationAttributes>) => {
    const { id, attrs, handleAttrsUpdate } = props;
    const { t } = useTranslation();

    const kind = attrs.kind ?? defaultYaujStationAttributes.kind;
    const isNormal = kind === 'normal';

    const fields: RmgFieldsField[] = [
        {
            type: 'select',
            label: t('panel.details.stations.yauj.kind'),
            value: kind,
            options: {
                normal: t('panel.details.stations.yauj.normal'),
                construction: t('panel.details.stations.yauj.construction'),
                closed: t('panel.details.stations.yauj.closed'),
                lineColor: t('panel.details.stations.yauj.lineColor'),
                lightRailTerminus: t('panel.details.stations.yauj.lightRailTerminus'),
                lightRailTerminusConstruction: t('panel.details.stations.yauj.lightRailTerminusConstruction'),
            },
            onChange: val => {
                attrs.kind = val as YaujStationKind;
                delete attrs.preciseNameOffsets;
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'textarea',
            label: t('panel.details.stations.common.nameZh'),
            value: attrs.names[0],
            onChange: val => {
                attrs.names[0] = val;
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'textarea',
            label: t('panel.details.stations.common.nameEn'),
            value: attrs.names.at(1) ?? defaultYaujStationAttributes.names[1],
            onChange: val => {
                attrs.names[1] = val;
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'custom',
            label: '',
            component: (
                <NameOffsetPad
                    // a dragged (custom) name position marks no side
                    value={attrs.preciseNameOffsets ? undefined : { x: attrs.nameOffsetX, y: attrs.nameOffsetY }}
                    onChange={({ x, y }) => {
                        attrs.nameOffsetX = x;
                        attrs.nameOffsetY = y;
                        delete attrs.preciseNameOffsets;
                        handleAttrsUpdate(id, attrs);
                    }}
                />
            ),
            minW: 'full',
        },
    ];

    // The light rail terminus has no label, so no name fields either.
    const isLightRailTerminus = kind === 'lightRailTerminus' || kind === 'lightRailTerminusConstruction';
    if (isLightRailTerminus) fields.splice(1);

    if (isNormal) {
        fields.push({
            type: 'custom',
            label: t('panel.details.stations.common.rotate'),
            component: <RotateField type={StationType.Yauj} defaultAttributes={defaultYaujStationAttributes} pad />,
            minW: 'full',
        });
    }
    if (isLightRailTerminus || kind === 'lineColor') {
        fields.push({
            type: 'custom',
            label: t('color'),
            component: <ColorField type={StationType.Yauj} defaultTheme={defaultYaujStationAttributes.color} />,
            minW: 'full',
        });
    }

    return (
        <>
            <RmgFields fields={fields} />
            {isNormal && (
                <InterchangeField
                    stationType={StationType.Yauj}
                    defaultAttrs={defaultYaujStationAttributes}
                    maximumTransfers={[1000, 0, 0]}
                    statusOptions={Object.fromEntries(
                        YAUJ_LINE_STATUSES.map(status => [status, t(`panel.details.stations.yauj.status.${status}`)])
                    )}
                />
            )}
        </>
    );
};

const yaujStationIcon = (
    <svg viewBox="0 0 24 24" height="40" width="40" focusable={false}>
        <circle cx="9" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="15" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5" fill="none" />
    </svg>
);

const yaujStation: Station<YaujStationAttributes> = {
    component: YaujStation,
    overlayComponent: SameStyleLineEndpointOverlay,
    icon: yaujStationIcon,
    defaultAttrs: defaultYaujStationAttributes,
    attrsComponent: YaujStationAttrsComponent,
    metadata: {
        displayName: 'panel.details.stations.yauj.displayName',
        cities: [CityCode.Hongkong],
        canvas: [CanvasType.RailMap],
        categories: [CategoriesType.Metro],
        tags: [],
    },
};

export default yaujStation;
