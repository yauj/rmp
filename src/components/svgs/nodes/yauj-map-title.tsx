import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AttrsProps } from '../../../constants/constants';
import { MiscNodeType, Node, NodeComponentProps } from '../../../constants/nodes';
import { getLangStyle, TextLanguage } from '../../../util/fonts';
import { useSvgRenderContext } from '../../svg-render-context';

/**
 * The map title block: the Chinese name (80), the English name (50) and the data date in brackets (40), always black
 * and always spaced the same. The node sits on the centre of the Chinese name.
 */
const LINES = {
    zh: { size: 80, y: 0 },
    en: { size: 50, y: 70 },
    date: { size: 40, y: 120 },
};

const YaujMapTitle = (props: NodeComponentProps<YaujMapTitleAttributes>) => {
    const { ensureFont } = useSvgRenderContext();
    const { id, attrs, handlePointerDown, handlePointerMove, handlePointerUp } = props;
    const { names = defaultYaujMapTitleAttributes.names, date = defaultYaujMapTitleAttributes.date } =
        attrs ?? defaultYaujMapTitleAttributes;

    const blockEl = React.useRef<SVGGElement | null>(null);
    const [bBox, setBBox] = React.useState({ x: -100, y: -40, width: 200, height: 200 } as DOMRect);
    React.useEffect(() => setBBox(blockEl.current!.getBBox()), [names[0], names[1], date]);

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
            <g ref={blockEl} textAnchor="middle" dominantBaseline="middle" fill="#000000">
                <text {...getLangStyle(TextLanguage.mtr_zh)} y={LINES.zh.y} fontSize={LINES.zh.size}>
                    {names[0]}
                </text>
                <text {...getLangStyle(TextLanguage.mtr_en)} y={LINES.en.y} fontSize={LINES.en.size}>
                    {names[1]}
                </text>
                <text {...getLangStyle(TextLanguage.mtr_en)} y={LINES.date.y} fontSize={LINES.date.size}>
                    {`(${date})`}
                </text>
            </g>
        </g>
    );
};

/**
 * YaujMapTitle specific props. `date` is the map's data date as YYYY-MM-DD, shown in brackets.
 */
export interface YaujMapTitleAttributes {
    names: [string, string];
    date: string;
}

const defaultYaujMapTitleAttributes: YaujMapTitleAttributes = {
    names: ['地區', 'Region'],
    date: new Date().toISOString().slice(0, 10),
};

const YaujMapTitleAttrsComponent = (props: AttrsProps<YaujMapTitleAttributes>) => {
    const { id, attrs, handleAttrsUpdate } = props;
    const { t } = useTranslation();

    const fields: RmgFieldsField[] = [
        {
            type: 'input',
            label: t('panel.details.nodes.yaujMapTitle.nameZh'),
            value: attrs.names[0],
            onChange: val => {
                attrs.names[0] = val.toString();
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'input',
            label: t('panel.details.nodes.yaujMapTitle.nameEn'),
            value: attrs.names.at(1) ?? '',
            onChange: val => {
                attrs.names[1] = val.toString();
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
        {
            type: 'input',
            label: t('panel.details.nodes.yaujMapTitle.date'),
            value: attrs.date ?? defaultYaujMapTitleAttributes.date,
            onChange: val => {
                attrs.date = val.toString();
                handleAttrsUpdate(id, attrs);
            },
            minW: 'full',
        },
    ];

    return <RmgFields fields={fields} />;
};

const yaujMapTitleIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <text x="12" y="9" textAnchor="middle" fontSize="8" fill="currentColor">
            地區
        </text>
        <text x="12" y="16" textAnchor="middle" fontSize="5" fill="currentColor">
            Region
        </text>
        <text x="12" y="22" textAnchor="middle" fontSize="4" fill="currentColor">
            (date)
        </text>
    </svg>
);

const yaujMapTitle: Node<YaujMapTitleAttributes> = {
    component: YaujMapTitle,
    icon: yaujMapTitleIcon,
    defaultAttrs: defaultYaujMapTitleAttributes,
    attrsComponent: YaujMapTitleAttrsComponent,
    metadata: {
        displayName: 'panel.details.nodes.yaujMapTitle.displayName',
        tags: [],
    },
};

export default yaujMapTitle;
