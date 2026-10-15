import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { MonoColour } from '@railmapgen/rmg-palette-resources';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AttrsProps, CityCode } from '../../../constants/constants';
import { MiscNodeType, Node, NodeComponentProps } from '../../../constants/nodes';
import { getLangStyle, TextLanguage } from '../../../util/fonts';
import { ColorAttribute, ColorField } from '../../panels/details/color-field';
import { useSvgRenderContext } from '../../svg-render-context';

export type YaujPlaceLabelPreset = 'city' | 'district';

/**
 * Both names are drawn as one block: the Chinese name centred on the node, the English name below it. The preset
 * decides the font sizes. The Chinese name is letter-spaced automatically, so type it without spaces.
 */
const PRESETS: Record<YaujPlaceLabelPreset, { zhSize: number; enSize: number; gap: number }> = {
    city: { zhSize: 20, enSize: 15, gap: 20 },
    district: { zhSize: 15, enSize: 10, gap: 15 },
};
const ZH_LETTER_SPACING = 0.3;

const YaujPlaceLabel = (props: NodeComponentProps<YaujPlaceLabelAttributes>) => {
    const { ensureFont } = useSvgRenderContext();
    const { id, attrs, handlePointerDown, handlePointerMove, handlePointerUp } = props;
    const {
        names = defaultYaujPlaceLabelAttributes.names,
        preset = defaultYaujPlaceLabelAttributes.preset,
        color = defaultYaujPlaceLabelAttributes.color,
    } = attrs ?? defaultYaujPlaceLabelAttributes;

    const blockEl = React.useRef<SVGGElement | null>(null);
    const [bBox, setBBox] = React.useState({ x: -16, y: -8, width: 32, height: 16 } as DOMRect);
    React.useEffect(() => setBBox(blockEl.current!.getBBox()), [names[0], names[1], preset]);

    React.useEffect(() => {
        ensureFont(TextLanguage.mtr_zh);
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

    const { zhSize, enSize, gap } = PRESETS[preset] ?? PRESETS.city;
    const [zh, en = ''] = names;
    const spacing = zhSize * ZH_LETTER_SPACING;

    return (
        <g
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ cursor: 'move' }}
        >
            <rect
                className="removeMe"
                fill="gray"
                fillOpacity="0.1"
                x={bBox.x - 1.5}
                y={bBox.y - 1.5}
                width={bBox.width + 3}
                height={bBox.height + 3}
            />
            <g ref={blockEl} textAnchor="middle" fill={color[2]}>
                {/* The trailing letter-spacing is part of the text length, so shift back by half of it. */}
                <text
                    {...getLangStyle(TextLanguage.mtr_zh)}
                    x={spacing / 2}
                    dominantBaseline="middle"
                    fontSize={zhSize}
                    letterSpacing={spacing}
                >
                    {zh}
                </text>
                <text {...getLangStyle(TextLanguage.mtr_en)} y={gap} dominantBaseline="middle" fontSize={enSize}>
                    {en}
                </text>
            </g>
        </g>
    );
};

/**
 * YaujPlaceLabel specific props.
 */
export interface YaujPlaceLabelAttributes extends ColorAttribute {
    names: [string, string];
    preset: YaujPlaceLabelPreset;
}

const defaultYaujPlaceLabelAttributes: YaujPlaceLabelAttributes = {
    names: ['城市', 'City'],
    preset: 'city',
    color: [CityCode.Other, 'other', '#c0c0c0', MonoColour.white],
};

const YaujPlaceLabelAttrsComponent = (props: AttrsProps<YaujPlaceLabelAttributes>) => {
    const { id, attrs, handleAttrsUpdate } = props;
    const { t } = useTranslation();

    const fields: RmgFieldsField[] = [
        {
            type: 'select',
            label: t('panel.details.nodes.yaujPlaceLabel.preset'),
            value: attrs.preset ?? defaultYaujPlaceLabelAttributes.preset,
            options: {
                city: t('panel.details.nodes.yaujPlaceLabel.city'),
                district: t('panel.details.nodes.yaujPlaceLabel.district'),
            },
            onChange: val => {
                attrs.preset = val as YaujPlaceLabelPreset;
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'input',
            label: t('panel.details.nodes.yaujPlaceLabel.nameZh'),
            value: attrs.names[0],
            onChange: val => {
                attrs.names[0] = val.toString();
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'input',
            label: t('panel.details.nodes.yaujPlaceLabel.nameEn'),
            value: attrs.names.at(1) ?? '',
            onChange: val => {
                attrs.names[1] = val.toString();
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'custom',
            label: t('color'),
            component: (
                <ColorField type={MiscNodeType.YaujPlaceLabel} defaultTheme={defaultYaujPlaceLabelAttributes.color} />
            ),
            minW: 'full',
        },
    ];

    return <RmgFields fields={fields} />;
};

const yaujPlaceLabelIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <text x="12" y="11" textAnchor="middle" fontSize="9" fill="currentColor">
            城市
        </text>
        <text x="12" y="20" textAnchor="middle" fontSize="6" fill="currentColor">
            City
        </text>
    </svg>
);

const yaujPlaceLabel: Node<YaujPlaceLabelAttributes> = {
    component: YaujPlaceLabel,
    icon: yaujPlaceLabelIcon,
    defaultAttrs: defaultYaujPlaceLabelAttributes,
    attrsComponent: YaujPlaceLabelAttrsComponent,
    metadata: {
        displayName: 'panel.details.nodes.yaujPlaceLabel.displayName',
        tags: [],
    },
};

export default yaujPlaceLabel;
