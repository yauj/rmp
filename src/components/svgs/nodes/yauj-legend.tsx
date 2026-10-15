import { MonoColour } from '@railmapgen/rmg-palette-resources';
import React from 'react';
import { CityCode, Theme } from '../../../constants/constants';
import { LinePathType, LineStyleComponentProps, LineStyleType } from '../../../constants/lines';
import { Node, NodeComponentProps } from '../../../constants/nodes';
import { YAUJ_LIGHT_RAIL_COLOR, YAUJ_METRO_COLOR } from '../../../constants/yauj-colors';
import { getLangStyle, TextLanguage } from '../../../util/fonts';
import { linePaths, lineStyles } from '../lines/lines';
import { YaujInterchangeGlyph, YaujLineStatus } from '../stations/yauj-station';
import { useSvgRenderContext } from '../../svg-render-context';
import { InterchangeInfo } from '../../panels/details/interchange-field';
import { YaujLineBadgeGlyph, YaujLineBadgeTier } from './yauj-line-badge';

/**
 * A fixed legend explaining every yauj line style, station type and line badge. Samples are drawn with the real line
 * styles and badge shapes, so the legend follows the style defaults.
 */
const COLUMN_WIDTH = 290;
const ROW_HEIGHT = 28;
const FIRST_ROW_Y = 58;
const SAMPLE_WIDTH = 66;
const WIDTH = COLUMN_WIDTH * 3 + 8;
const HEIGHT = FIRST_ROW_Y + 9 * ROW_HEIGHT + 40;
// Sample lines for the interchange rows: Tsuen Wan Line and Kwun Tong Line.
const RED = '#e60013';
const GREEN = '#01a040';

const theme = (city: CityCode, id: string, color: `#${string}`): Theme => [city, id, color, MonoColour.white];
const BADGE_COLORS = {
    metro: YAUJ_METRO_COLOR,
    fast: theme(CityCode.Guangzhou, 'gz4', '#00843d'),
    higher: theme(CityCode.Hongkong, 'eal', '#5db7e8'),
    high: theme(CityCode.Guangzhou, 'gz18', '#3040b6'),
    regional: theme(CityCode.Guangzhou, 'gdcj', '#255aa8'),
    highRegional: theme(CityCode.Guangzhou, 'gdcj', '#255aa8'),
} satisfies Record<string, Theme>;

type StyleComponent = React.FC<LineStyleComponentProps<any>>;

interface LineRow {
    style: LineStyleType;
    zh: string;
    en: string;
    attrs?: Record<string, unknown>;
}

const LINE_ROWS: LineRow[] = [
    { style: LineStyleType.YaujMetro, zh: '地铁', en: 'Metro' },
    { style: LineStyleType.YaujRail, zh: '铁路', en: 'Rail' },
    {
        style: LineStyleType.YaujRail,
        zh: '铁路（较低速度）',
        en: 'Rail, slower speed',
        attrs: { limitedService: true },
    },
    { style: LineStyleType.YaujLightRail, zh: '轻轨 / 有轨电车', en: 'Light rail / tram' },
    { style: LineStyleType.YaujConstruction, zh: '在建', en: 'Under construction' },
    { style: LineStyleType.YaujLightRailConstruction, zh: '轻轨在建', en: 'Light rail under construction' },
    { style: LineStyleType.YaujLimited, zh: '限停 / 大站快线', en: 'Limited service' },
    { style: LineStyleType.YaujOsi, zh: '站外换乘', en: 'Out-of-station interchange' },
    { style: LineStyleType.YaujInterchange, zh: '站内换乘', en: 'In-station interchange' },
    { style: LineStyleType.YaujBorder, zh: '城市边界', en: 'City border' },
];

const BADGE_ROWS: { tier: YaujLineBadgeTier; names: [string, string]; zh: string; en: string }[] = [
    { tier: 'metro', names: ['1', ''], zh: '普通地铁 ≤ 80 km/h', en: 'Normal metro' },
    { tier: 'fast', names: ['2', ''], zh: '较快地铁 < 120 km/h', en: 'Fast speed metro' },
    { tier: 'higher', names: ['3', ''], zh: '高速地铁 < 160 km/h', en: 'Higher speed metro' },
    { tier: 'high', names: ['4', ''], zh: '快速地铁 ≥ 160 km/h', en: 'High speed metro' },
    { tier: 'regional', names: ['城际', 'Regional'], zh: '城际铁路 < 140 km/h', en: 'Regional rail' },
    {
        tier: 'highRegional',
        names: ['城际', 'Regional'],
        zh: '较高速城际 ≥ 140 km/h',
        en: 'Higher speed regional rail',
    },
];

const info = (color: string): InterchangeInfo => [
    CityCode.Hongkong,
    'legend',
    color as `#${string}`,
    MonoColour.white,
    '',
    '',
];
const slot = (color: string, status: YaujLineStatus) => ({ info: info(color), status });

interface StationRow {
    zh: string;
    en: string;
    sample: React.ReactNode;
}

const StatusLabel = (props: { zh: string; en: string }) => (
    <g fontSize={5.2} fill="#000">
        <text {...getLangStyle(TextLanguage.zh)} x={11} y={-0.5}>
            {props.zh}
        </text>
        <text {...getLangStyle(TextLanguage.mtr_en)} x={11} y={6}>
            {props.en}
        </text>
    </g>
);

const DottedCircle = (props: { cx?: number }) => (
    <circle cx={props.cx ?? 0} r={5} fill="white" stroke="black" strokeWidth="0.5" strokeDasharray="1.5" />
);

const STATION_ROWS: StationRow[] = [
    { zh: '车站', en: 'Station', sample: <YaujInterchangeGlyph slots={[]} /> },
    {
        zh: '换乘站',
        en: 'Interchange',
        sample: <YaujInterchangeGlyph slots={[slot(RED, 'open'), slot(GREEN, 'open')]} />,
    },
    {
        zh: '终点站 / 中途折返站',
        en: 'Terminus (border in the line colour)',
        sample: <YaujInterchangeGlyph slots={[slot(YAUJ_METRO_COLOR[2], 'terminus')]} />,
    },
    {
        zh: '换乘站，其中一线为终点',
        en: 'Interchange, one line terminates',
        sample: <YaujInterchangeGlyph slots={[slot(RED, 'open'), slot(GREEN, 'terminus')]} />,
    },
    {
        zh: '在建车站',
        en: 'Under construction',
        sample: (
            <>
                <DottedCircle />
                <StatusLabel zh="(施工封闭)" en="(U/C)" />
            </>
        ),
    },
    {
        zh: '停运车站',
        en: 'Closed',
        sample: (
            <>
                <DottedCircle />
                <StatusLabel zh="(暂缓开通)" en="(Closed)" />
            </>
        ),
    },
    {
        zh: '换乘站，其中一线在建 / 停运',
        en: 'Interchange with an under-construction / closed line',
        sample: <YaujInterchangeGlyph slots={[slot(RED, 'open'), slot(GREEN, 'construction')]} />,
    },
    {
        zh: '站外换乘（两条运营线之间的在建线）',
        en: 'Out-of-station interchange between the two open lines',
        sample: <YaujInterchangeGlyph slots={[slot(RED, 'open'), slot('#888', 'construction'), slot(GREEN, 'open')]} />,
    },
    {
        zh: '轻轨终点站',
        en: 'Light rail terminus',
        sample: <circle r={2.5} fill="white" stroke={YAUJ_LIGHT_RAIL_COLOR[2]} strokeWidth=".8" />,
    },
    {
        zh: '轻轨终点站（在建）',
        en: 'Light rail terminus, under construction',
        sample: (
            <circle r={2.5} fill="white" stroke={YAUJ_LIGHT_RAIL_COLOR[2]} strokeWidth=".8" strokeDasharray="1 1" />
        ),
    },
];

const Label = (props: { zh: string; en: string }) => (
    <g fill="#000">
        <text {...getLangStyle(TextLanguage.zh)} x={SAMPLE_WIDTH + 8} y={-1} fontSize={9}>
            {props.zh}
        </text>
        <text {...getLangStyle(TextLanguage.mtr_en)} x={SAMPLE_WIDTH + 8} y={8} fontSize={6.5}>
            {props.en}
        </text>
    </g>
);

const Heading = (props: { x: number; zh: string; en: string }) => (
    <g transform={`translate(${props.x}, 38)`} fill="#000">
        <text {...getLangStyle(TextLanguage.zh)} fontSize={12}>
            {props.zh}
        </text>
        <text {...getLangStyle(TextLanguage.mtr_en)} x={props.zh.length * 13 + 4} fontSize={9}>
            {props.en}
        </text>
        <line x1={0} x2={COLUMN_WIDTH - 20} y1={6} y2={6} stroke="#999" strokeWidth={0.5} />
    </g>
);

const LineSample = (props: { row: LineRow; y: number }) => {
    const { row, y } = props;
    const style = lineStyles[row.style];
    const Component = style.component as StyleComponent;
    const path = linePaths[LinePathType.Simple].generatePath(4, SAMPLE_WIDTH - 4, 0, 0, { offset: 0 });
    return (
        <g transform={`translate(0, ${y})`}>
            <Component
                id={`line_yauj_legend_${row.style}`}
                type={LinePathType.Simple}
                path={path}
                styleAttrs={{ ...structuredClone(style.defaultAttrs), ...row.attrs }}
                newLine={true}
                handlePointerDown={() => {}}
            />
            <Label zh={row.zh} en={row.en} />
        </g>
    );
};

const YaujLegend = (props: NodeComponentProps<YaujLegendAttributes>) => {
    const { ensureFont } = useSvgRenderContext();
    const { id, handlePointerDown, handlePointerMove, handlePointerUp } = props;

    React.useEffect(() => {
        ensureFont(TextLanguage.zh);
        ensureFont(TextLanguage.mtr_en);
    }, [ensureFont]);

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

    const rowY = (i: number) => FIRST_ROW_Y + i * ROW_HEIGHT;

    return (
        <g
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ cursor: 'move' }}
        >
            <rect className="removeMe" fill="gray" fillOpacity="0.1" x={-12} y={-14} width={WIDTH} height={HEIGHT} />
            <rect fill="white" stroke="#999" strokeWidth={0.5} x={-12} y={-14} width={WIDTH} height={HEIGHT} />
            <g fill="#000">
                <text {...getLangStyle(TextLanguage.zh)} fontSize={16} y={8}>
                    图例
                </text>
                <text {...getLangStyle(TextLanguage.mtr_en)} fontSize={11} x={44} y={8}>
                    Legend
                </text>
            </g>

            <Heading x={0} zh="线路" en="Lines" />
            {LINE_ROWS.map((row, i) => (
                <LineSample key={`${row.style}-${i}`} row={row} y={rowY(i)} />
            ))}

            <g transform={`translate(${COLUMN_WIDTH}, 0)`}>
                <Heading x={0} zh="车站" en="Stations" />
                {STATION_ROWS.map((row, i) => (
                    <g key={row.en} transform={`translate(0, ${rowY(i)})`}>
                        <g transform="translate(14, 0)">{row.sample}</g>
                        <Label zh={row.zh} en={row.en} />
                    </g>
                ))}
            </g>

            <g transform={`translate(${COLUMN_WIDTH * 2}, 0)`}>
                <Heading x={0} zh="线路标识" en="Line badges" />
                {BADGE_ROWS.map((row, i) => (
                    <g key={row.tier} transform={`translate(0, ${rowY(i)})`}>
                        <g transform="translate(26, 0)">
                            <YaujLineBadgeGlyph names={row.names} tier={row.tier} color={BADGE_COLORS[row.tier]} />
                        </g>
                        <Label zh={row.zh} en={row.en} />
                    </g>
                ))}
                <g transform={`translate(0, ${rowY(BADGE_ROWS.length) + 4})`} fill="#000">
                    <text {...getLangStyle(TextLanguage.zh)} fontSize={7}>
                        字母表示支线或分段，如 6B；速度为设计最高速度。
                    </text>
                    <text {...getLangStyle(TextLanguage.mtr_en)} fontSize={5.5} y={9}>
                        A letter marks a branch, e.g. 6B. Speeds are design maximum speeds.
                    </text>
                </g>
            </g>
            <rect
                id={`misc_node_connectable_${id}`}
                style={{ cursor: 'move' }}
                x={-12}
                y={-14}
                width={WIDTH}
                height={HEIGHT}
                fill="white"
                opacity={0}
            />
        </g>
    );
};

/**
 * YaujLegend has no attributes.
 */
export type YaujLegendAttributes = Record<string, never>;

const defaultYaujLegendAttributes: YaujLegendAttributes = {};

const yaujLegendIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="6" x2="11" y1="8" y2="8" stroke="currentColor" strokeWidth="1.6" />
        <line x1="6" x2="11" y1="12" y2="12" stroke="currentColor" strokeWidth="1.6" strokeDasharray="1.5 1.2" />
        <circle cx="8.5" cy="16" r="1.6" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="13" x2="18" y1="8" y2="8" stroke="currentColor" strokeWidth="1" />
        <line x1="13" x2="18" y1="12" y2="12" stroke="currentColor" strokeWidth="1" />
        <line x1="13" x2="18" y1="16" y2="16" stroke="currentColor" strokeWidth="1" />
    </svg>
);

const yaujLegend: Node<YaujLegendAttributes> = {
    component: YaujLegend,
    icon: yaujLegendIcon,
    defaultAttrs: defaultYaujLegendAttributes,
    attrsComponent: () => undefined,
    metadata: {
        displayName: 'panel.details.nodes.yaujLegend.displayName',
        tags: [],
    },
};

export default yaujLegend;
