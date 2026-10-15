import { RmgFields } from '@railmapgen/rmg-components';
import { MonoColour } from '@railmapgen/rmg-palette-resources';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AttrsProps, CityCode, Theme } from '../../../../constants/constants';
import {
    LINE_WIDTH,
    LinePathAttributes,
    LineStyle,
    LineStyleComponentProps,
    LineStyleType,
} from '../../../../constants/lines';
import { YAUJ_LIGHT_RAIL_COLOR, YAUJ_METRO_COLOR, YAUJ_RAIL_COLOR } from '../../../../constants/yauj-colors';
import { ColorAttribute, ColorField } from '../../../panels/details/color-field';
import bjsubwayDotted, { BjsubwayDottedAttributes } from './bjsubway-dotted';
import londonRail, { LondonRailAttributes } from './london-rail';
import mtrLightRail, { MTRLightRailAttributes } from './mtr-light-rail';
import mtrRaceDays, { MTRRaceDaysAttributes } from './mtr-race-day';
import mtrPaidArea, { MTRPaidAreaAttributes } from './mtr-paid-area';
import mtrUnpaidArea, { MTRUnpaidAreaAttributes } from './mtr-unpaid-area';
import singleColor, { SingleColorAttributes } from './single-color';

/**
 * The yauj line styles. Most of them reuse the drawing of an existing style and only differ in their name and
 * attributes, so the colour field is bound to the yauj style type (required for the details panel and for the
 * runtime colour injection):
 *
 * | yauj style         | drawn as                                      |
 * | ------------------ | --------------------------------------------- |
 * | yauj-metro         | solid line                                    |
 * | yauj-rail          | London rail (dashed over a coloured line)     |
 * | yauj-light-rail    | thin line                                     |
 * | yauj-construction  | Beijing Subway dotted (under construction)    |
 * | yauj-osi           | Hong Kong dashed out-of-station interchange   |
 * | yauj-interchange   | Hong Kong solid in-station interchange        |
 * | yauj-light-rail-construction | thin dotted line in the line colour (light rail expansion) |
 * | yauj-limited        | dashed line in the line colour (limited service / express overlay) |
 * | yauj-border        | city border (solid pale grey, not a rail line)  |
 */

const singleColorAttrsComponent = (type: LineStyleType, defaultTheme: Theme) => (_: AttrsProps<ColorAttribute>) => {
    const { t } = useTranslation();
    return (
        <RmgFields
            fields={[
                {
                    type: 'custom',
                    label: t('color'),
                    component: <ColorField type={type} defaultTheme={defaultTheme} />,
                },
            ]}
        />
    );
};

/* ----- Metro: solid line ----- */

const defaultYaujMetroAttributes: SingleColorAttributes = {
    color: [...YAUJ_METRO_COLOR],
};

export const yaujMetro: LineStyle<SingleColorAttributes> = {
    ...singleColor,
    defaultAttrs: defaultYaujMetroAttributes,
    attrsComponent: singleColorAttrsComponent(LineStyleType.YaujMetro, defaultYaujMetroAttributes.color),
    metadata: { ...singleColor.metadata, displayName: 'panel.details.lines.yaujMetro.displayName' },
};

/* ----- Rail: London rail dashes ----- */

const defaultYaujRailAttributes: LondonRailAttributes = {
    colorBackground: [...YAUJ_RAIL_COLOR],
    colorForeground: [CityCode.London, 'white', '#ffffff', MonoColour.black],
    limitedService: false,
};

const YaujRailAttrsComponent = (props: AttrsProps<LondonRailAttributes>) => {
    const { id, attrs, handleAttrsUpdate } = props;
    const { t } = useTranslation();
    return (
        <RmgFields
            fields={[
                {
                    type: 'switch',
                    label: t('panel.details.lines.yaujRail.limitedService'),
                    oneLine: true,
                    isChecked: attrs.limitedService ?? false,
                    onChange: val => {
                        attrs.limitedService = val;
                        handleAttrsUpdate(id, attrs);
                    },
                    minW: 'full',
                },
                {
                    type: 'custom',
                    label: t('panel.details.lines.yaujRail.colorBackground'),
                    component: (
                        <ColorField
                            type={LineStyleType.YaujRail}
                            colorKey="colorBackground"
                            defaultTheme={defaultYaujRailAttributes.colorBackground}
                        />
                    ),
                },
                {
                    type: 'custom',
                    label: t('panel.details.lines.yaujRail.colorForeground'),
                    component: (
                        <ColorField
                            type={LineStyleType.YaujRail}
                            colorKey="colorForeground"
                            defaultTheme={defaultYaujRailAttributes.colorForeground}
                        />
                    ),
                },
            ]}
        />
    );
};

export const yaujRail: LineStyle<LondonRailAttributes> = {
    ...londonRail,
    defaultAttrs: defaultYaujRailAttributes,
    attrsComponent: YaujRailAttrsComponent,
    metadata: { ...londonRail.metadata, displayName: 'panel.details.lines.yaujRail.displayName' },
};

/* ----- Light rail: thin line ----- */

const defaultYaujLightRailAttributes: MTRLightRailAttributes = {
    color: [...YAUJ_LIGHT_RAIL_COLOR],
};

export const yaujLightRail: LineStyle<MTRLightRailAttributes> = {
    ...mtrLightRail,
    defaultAttrs: defaultYaujLightRailAttributes,
    attrsComponent: singleColorAttrsComponent(LineStyleType.YaujLightRail, defaultYaujLightRailAttributes.color),
    metadata: { ...mtrLightRail.metadata, displayName: 'panel.details.lines.yaujLightRail.displayName' },
};

/* ----- Under construction: Beijing dotted ----- */

const defaultYaujConstructionAttributes: BjsubwayDottedAttributes = {
    color: [...YAUJ_METRO_COLOR],
};

export const yaujConstruction: LineStyle<BjsubwayDottedAttributes> = {
    ...bjsubwayDotted,
    defaultAttrs: defaultYaujConstructionAttributes,
    attrsComponent: singleColorAttrsComponent(LineStyleType.YaujConstruction, defaultYaujConstructionAttributes.color),
    metadata: { ...bjsubwayDotted.metadata, displayName: 'panel.details.lines.yaujConstruction.displayName' },
};

/* ----- Hong Kong interchange lines (no attributes) ----- */

const noAttrsComponent = () => undefined;

export const yaujOsi: LineStyle<MTRUnpaidAreaAttributes> = {
    ...mtrUnpaidArea,
    attrsComponent: noAttrsComponent,
    metadata: { ...mtrUnpaidArea.metadata, displayName: 'panel.details.lines.yaujOsi.displayName' },
};

export const yaujInterchange: LineStyle<MTRPaidAreaAttributes> = {
    ...mtrPaidArea,
    attrsComponent: noAttrsComponent,
    metadata: { ...mtrPaidArea.metadata, displayName: 'panel.details.lines.yaujInterchange.displayName' },
};

/* ----- City border: plain solid line in a pale grey ----- */

const defaultYaujBorderAttributes: SingleColorAttributes = {
    color: [CityCode.Other, 'other', '#ebebeb', MonoColour.white],
};

export const yaujBorder: LineStyle<SingleColorAttributes> = {
    ...singleColor,
    defaultAttrs: defaultYaujBorderAttributes,
    attrsComponent: singleColorAttrsComponent(LineStyleType.YaujBorder, defaultYaujBorderAttributes.color),
    metadata: { ...singleColor.metadata, displayName: 'panel.details.lines.yaujBorder.displayName' },
};

/* ----- Limited service: dashed line in the line colour, drawn over the line it runs on ----- */

const defaultYaujLimitedAttributes: MTRRaceDaysAttributes = {
    color: [...YAUJ_METRO_COLOR],
};

export const yaujLimited: LineStyle<MTRRaceDaysAttributes> = {
    ...mtrRaceDays,
    defaultAttrs: defaultYaujLimitedAttributes,
    attrsComponent: singleColorAttrsComponent(LineStyleType.YaujLimited, defaultYaujLimitedAttributes.color),
    metadata: { ...mtrRaceDays.metadata, displayName: 'panel.details.lines.yaujLimited.displayName' },
};

/* ----- Light rail expansion: one of the two dashed outlines of the Beijing dotted construction line ----- */

const YaujLightRailConstruction = (props: LineStyleComponentProps<MTRLightRailAttributes>) => {
    const { id, path, styleAttrs, newLine, handlePointerDown } = props;
    const { color = defaultYaujLightRailConstructionAttributes.color } =
        styleAttrs ?? defaultYaujLightRailConstructionAttributes;

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerDown(id, e),
        [id, handlePointerDown]
    );

    return (
        <g
            onPointerDown={newLine ? undefined : onPointerDown}
            cursor="pointer"
            pointerEvents={newLine ? 'none' : undefined}
        >
            {/* The line is too thin to click, so give it an invisible wider hit area. */}
            <path d={path.d} fill="none" stroke="transparent" strokeWidth={LINE_WIDTH} />
            <path d={path.d} fill="none" stroke={color[2]} strokeWidth={0.8} strokeDasharray="2 2" />
        </g>
    );
};

const defaultYaujLightRailConstructionAttributes: MTRLightRailAttributes = {
    color: [...YAUJ_LIGHT_RAIL_COLOR],
};

export const yaujLightRailConstruction: LineStyle<MTRLightRailAttributes> = {
    ...mtrLightRail,
    component: YaujLightRailConstruction,
    defaultAttrs: defaultYaujLightRailConstructionAttributes,
    attrsComponent: singleColorAttrsComponent(
        LineStyleType.YaujLightRailConstruction,
        defaultYaujLightRailConstructionAttributes.color
    ),
    metadata: {
        ...mtrLightRail.metadata,
        displayName: 'panel.details.lines.yaujLightRailConstruction.displayName',
    },
};
