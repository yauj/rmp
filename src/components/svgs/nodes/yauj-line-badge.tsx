import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { MonoColour } from '@railmapgen/rmg-palette-resources';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AttrsProps, CityCode, Theme } from '../../../constants/constants';
import { MiscNodeType, Node, NodeComponentProps } from '../../../constants/nodes';
import { getLangStyle, TextLanguage } from '../../../util/fonts';
import { ColorAttribute, ColorField } from '../../panels/details/color-field';
import { MultilineText } from '../common/multiline-text';
import { SameStyleLineEndpointOverlay } from '../common/same-style-line-endpoint-overlay';

export type YaujLineBadgeTier = 'metro' | 'fast' | 'higher' | 'high' | 'regional' | 'highRegional';

/**
 * Each service tier is drawn as a shape, with or without the inner outline. Speed bands (km/h): metro <= 80,
 * fast < 120, higher < 160, high >= 160; regional rail < 140, higher speed regional rail >= 140.
 */
const TIER_STYLES: Record<YaujLineBadgeTier, { shape: 'circle' | 'square' | 'rect'; outline: boolean }> = {
    metro: { shape: 'circle', outline: false },
    fast: { shape: 'circle', outline: true },
    higher: { shape: 'square', outline: false },
    high: { shape: 'square', outline: true },
    regional: { shape: 'rect', outline: false },
    highRegional: { shape: 'rect', outline: true },
};

const HEIGHT = 21;

export const badgeWidth = (tier: YaujLineBadgeTier) =>
    (TIER_STYLES[tier] ?? TIER_STYLES.metro).shape === 'rect' ? 42 : 21;
export const BADGE_HEIGHT = HEIGHT;

/**
 * The badge drawing without any event handling, centred on (0, 0). `children` are drawn on top inside the badge's own
 * coordinate space (top left at 0, 0), which is where the node puts its hit area.
 */
export const YaujLineBadgeGlyph = (props: {
    names: [string, string];
    tier: YaujLineBadgeTier;
    color: Theme;
    children?: React.ReactNode;
}) => {
    const { names, tier, color, children } = props;
    const { shape, outline } = TIER_STYLES[tier] ?? TIER_STYLES.metro;
    const width = shape === 'rect' ? 42 : 21;
    const fgColor = color[3];
    const [main, sub = ''] = names;
    const hasSub = sub !== '';

    // Single line: number-badge style (shrinks with length). Two lines: text-badge style.
    const mainFontSize = hasSub
        ? shape === 'rect'
            ? 8
            : outline
              ? 5
              : 6
        : shape === 'rect'
          ? 12
          : main.length <= 1
            ? 16
            : main.length === 2
              ? 14
              : 9;
    const mainLetterSpacing = !hasSub && main.length === 2 ? -1 : 0;

    return (
        <g>
            <g transform={`translate(${-width / 2}, ${-HEIGHT / 2})`}>
                {shape === 'circle' ? (
                    <circle fill={color[2]} cx={width / 2} cy={HEIGHT / 2} r={HEIGHT / 2} />
                ) : (
                    <rect fill={color[2]} x="0" width={width} height={HEIGHT} rx="3" ry="3" />
                )}
                {outline &&
                    (shape === 'circle' ? (
                        <circle
                            strokeWidth="1.5"
                            stroke="white"
                            fill="none"
                            cx={width / 2}
                            cy={HEIGHT / 2}
                            r={HEIGHT / 2 - 1.5}
                        />
                    ) : (
                        <rect
                            strokeWidth="1.5"
                            stroke="white"
                            fill="none"
                            x="1.5"
                            y="1.5"
                            width={width - 3}
                            height={HEIGHT - 3}
                            rx="2"
                            ry="2"
                        />
                    ))}
                <text
                    {...getLangStyle(hasSub ? TextLanguage.mtr_zh : TextLanguage.zh)}
                    textAnchor="middle"
                    x={width / 2}
                    y={hasSub ? HEIGHT / 2 + 0.5 : HEIGHT / 2}
                    dominantBaseline={hasSub ? undefined : 'central'}
                    fill={fgColor}
                    fontSize={mainFontSize}
                    letterSpacing={mainLetterSpacing}
                >
                    {main}
                </text>
                {hasSub && (
                    <MultilineText
                        text={sub.split('\n')}
                        {...getLangStyle(TextLanguage.mtr_en)}
                        textAnchor="middle"
                        x={width / 2}
                        y={HEIGHT / 2 - (shape === 'rect' ? 0 : 0.75)}
                        fill={fgColor}
                        fontSize={shape === 'rect' ? 4 : 2.2}
                        letterSpacing="0"
                        lineHeight={2.25}
                        grow={'down'}
                    />
                )}
                {children}
            </g>
        </g>
    );
};

const YaujLineBadge = (props: NodeComponentProps<YaujLineBadgeAttributes>) => {
    const { id, attrs, handlePointerDown, handlePointerMove, handlePointerUp } = props;
    const {
        names = defaultYaujLineBadgeAttributes.names,
        tier = defaultYaujLineBadgeAttributes.tier,
        color = defaultYaujLineBadgeAttributes.color,
    } = attrs ?? defaultYaujLineBadgeAttributes;

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

    return (
        <YaujLineBadgeGlyph names={names} tier={tier} color={color}>
            <rect
                id={`misc_node_connectable_${id}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{ cursor: 'move', zIndex: 1000 }}
                x={0}
                y={0}
                width={badgeWidth(tier)}
                height={HEIGHT}
                fill="white"
                opacity={0}
                stroke="none"
            />
        </YaujLineBadgeGlyph>
    );
};

/**
 * YaujLineBadge specific props.
 *
 * `names[0]` is the main text (a line number, letters such as "6B", or a Chinese name). `names[1]` is an optional
 * second line; leave it empty for a number-style badge.
 */
export interface YaujLineBadgeAttributes extends ColorAttribute {
    names: [string, string];
    tier: YaujLineBadgeTier;
}

const defaultYaujLineBadgeAttributes: YaujLineBadgeAttributes = {
    names: ['1', ''],
    tier: 'metro',
    color: [CityCode.Shenzhen, 'sz1', '#00b140', MonoColour.white],
};

const YaujLineBadgeAttrsComponent = (props: AttrsProps<YaujLineBadgeAttributes>) => {
    const { id, attrs, handleAttrsUpdate } = props;
    const { t } = useTranslation();

    const fields: RmgFieldsField[] = [
        {
            type: 'input',
            label: t('panel.details.nodes.yaujLineBadge.main'),
            value: attrs.names[0],
            onChange: val => {
                attrs.names[0] = val.toString();
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'textarea',
            label: t('panel.details.nodes.yaujLineBadge.sub'),
            value: attrs.names.at(1) ?? '',
            onChange: val => {
                attrs.names[1] = val.toString();
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'select',
            label: t('panel.details.nodes.yaujLineBadge.tier'),
            value: attrs.tier ?? defaultYaujLineBadgeAttributes.tier,
            options: {
                metro: t('panel.details.nodes.yaujLineBadge.metro'),
                fast: t('panel.details.nodes.yaujLineBadge.fast'),
                higher: t('panel.details.nodes.yaujLineBadge.higher'),
                high: t('panel.details.nodes.yaujLineBadge.high'),
                regional: t('panel.details.nodes.yaujLineBadge.regional'),
                highRegional: t('panel.details.nodes.yaujLineBadge.highRegional'),
            },
            onChange: val => {
                attrs.tier = val as YaujLineBadgeTier;
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'custom',
            label: t('color'),
            component: (
                <ColorField type={MiscNodeType.YaujLineBadge} defaultTheme={defaultYaujLineBadgeAttributes.color} />
            ),
            minW: 'full',
        },
    ];

    return <RmgFields fields={fields} />;
};

const yaujLineBadgeIcon = (
    <svg viewBox="0 0 21 21" height={40} width={40} focusable={false} style={{ padding: 3 }}>
        <circle fill="currentColor" cx="10.5" cy="10.5" r="10.5" />
        <circle strokeWidth="1.5" stroke="var(--chakra-colors-chakra-body-bg)" fill="none" cx="10.5" cy="10.5" r="9" />
        <text
            textAnchor="middle"
            x="10.5"
            y="10.5"
            fill="var(--chakra-colors-chakra-body-bg)"
            fontSize="13"
            dominantBaseline="central"
        >
            6B
        </text>
    </svg>
);

const yaujLineBadge: Node<YaujLineBadgeAttributes> = {
    component: YaujLineBadge,
    overlayComponent: SameStyleLineEndpointOverlay,
    icon: yaujLineBadgeIcon,
    defaultAttrs: defaultYaujLineBadgeAttributes,
    attrsComponent: YaujLineBadgeAttrsComponent,
    metadata: {
        displayName: 'panel.details.nodes.yaujLineBadge.displayName',
        tags: [],
    },
};

export default yaujLineBadge;
