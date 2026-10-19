import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from '@chakra-ui/react';
import { RmgAutoComplete, RmgFields, RmgFieldsField, RmgLineBadge } from '@railmapgen/rmg-components';
import { MonoColour } from '@railmapgen/rmg-palette-resources';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CityCode, LineId, MiscNodeId, NodeId, StnId, Theme } from '../../../constants/constants';
import { LineStyleType, isVisibleLineStyle } from '../../../constants/lines';
import { useRootDispatch, useRootSelector } from '../../../redux';
import { saveGraph } from '../../../redux/param/param-slice';
import { refreshEdgesThunk, refreshNodesThunk } from '../../../redux/runtime/runtime-slice';
import {
    changeLineStyleTypeInBatch,
    changeLinesColorInBatch,
    changeNodesColorInBatch,
} from '../../../util/change-types';
import { findThemes } from '../../../util/color';
import { usePaletteTheme } from '../../../util/hooks';
import { canUseLineStyle } from '../../../util/line-path-availability';
import { changeYaujStationsInBatch } from '../../../util/yauj-change-attributes';
import { NameOffset, NameOffsetPad } from '../../panels/details/name-offset-pad';
import { RotatePad } from '../../panels/details/rotate-pad';
import ThemeButton from '../../panels/theme-button';
import { lineStyles, normalizeEdgeAttributes } from '../../svgs/lines/lines';
import type { YaujStationKind } from '../../svgs/stations/yauj-station';
import type { FilterType } from './change-type-modal';

const KINDS: YaujStationKind[] = [
    'normal',
    'lineColor',
    'construction',
    'closed',
    'lightRailTerminus',
    'lightRailTerminusConstruction',
];

interface ColorChoice {
    id: string;
    theme: Theme;
    value: string;
}

/**
 * Yauj batch edits, for the whole map or (isSelect) for the selected objects: station type of Yauj stations, name offset
 * X / Y, line style and colour. Each section only applies when its accordion item has been opened.
 */
export const YaujChangeAttributeModal = (props: {
    isOpen: boolean;
    onClose: () => void;
    isSelect: boolean;
    filter?: FilterType[];
}) => {
    const { isOpen, onClose, isSelect, filter } = props;
    const { t } = useTranslation();
    const dispatch = useRootDispatch();
    const { selected } = useRootSelector(state => state.runtime);
    const mapEnabled = useRootSelector(state => state.param.present.mapEnabled);
    const { activeSubscriptions } = useRootSelector(state => state.account);
    const graph = React.useRef(window.graph);

    const any = t('header.settings.procedures.changeType.any');
    const kindOptions = Object.fromEntries(KINDS.map(kind => [kind, t(`panel.details.stations.yauj.${kind}`)]));
    const lineStyleOptions = Object.fromEntries(
        Object.values(LineStyleType)
            .filter(isVisibleLineStyle)
            .map(style => [style, t(lineStyles[style].metadata.displayName).toString()])
    ) as Partial<Record<LineStyleType, string>>;
    const yaujLineStyles = Object.values(LineStyleType).filter(
        style => isVisibleLineStyle(style) && String(style).startsWith('yauj-')
    );
    const targetLineStyleOptions = Object.fromEntries(
        yaujLineStyles.map(style => [style, lineStyleOptions[style] ?? style])
    );
    const disabledTargetLineStyles = yaujLineStyles.filter(
        style => !canUseLineStyle(style, activeSubscriptions.RMP_CLOUD)
    );
    const defaultColor: ColorChoice = {
        id: 'any',
        theme: [CityCode.Other, 'other', '#ffffff', MonoColour.black],
        value: any,
    };

    const [isKindOn, setIsKindOn] = React.useState(false);
    const [kindFrom, setKindFrom] = React.useState<YaujStationKind | 'any'>('any');
    const [kindTo, setKindTo] = React.useState<YaujStationKind>('normal');
    const [isOffsetOn, setIsOffsetOn] = React.useState(false);
    const [offset, setOffset] = React.useState<NameOffset>({ x: 'right', y: 'middle' });
    const [isRotateOn, setIsRotateOn] = React.useState(false);
    const [rotate, setRotate] = React.useState(0);
    const [isLineStyleOn, setIsLineStyleOn] = React.useState(false);
    const [styleFrom, setStyleFrom] = React.useState<LineStyleType | 'any'>('any');
    const [styleTo, setStyleTo] = React.useState<LineStyleType>(LineStyleType.YaujMetro);
    const [isColorOn, setIsColorOn] = React.useState(false);
    const [colorFrom, setColorFrom] = React.useState(defaultColor);
    const [themeList, setThemeList] = React.useState<ColorChoice[]>([]);
    const { theme: newTheme, requestThemeChange } = usePaletteTheme();

    React.useEffect(() => {
        if (!isOpen) return;
        setIsKindOn(false);
        setIsOffsetOn(false);
        setIsRotateOn(false);
        setIsLineStyleOn(false);
        setIsColorOn(false);
        setKindFrom('any');
        setStyleFrom('any');
        setColorFrom(defaultColor);
        setThemeList([
            defaultColor,
            ...findThemes(
                graph.current,
                (isSelect
                    ? [...selected].filter(id => id.startsWith('stn') || id.startsWith('misc_node'))
                    : graph.current.nodes()) as NodeId[],
                (isSelect ? [...selected].filter(id => id.startsWith('line')) : graph.current.edges()) as LineId[]
            ).map(theme => ({ id: theme.toString(), theme, value: theme[1] === 'other' ? theme[2] : theme[1] })),
        ]);
    }, [isOpen]);

    const sections: { id: string; title: string; toggle: () => void; fields: RmgFieldsField[] }[] = [
        {
            id: 'kind',
            title: t('header.settings.procedures.yaujChange.stationKind'),
            toggle: () => setIsKindOn(on => !on),
            fields: [
                {
                    type: 'select',
                    label: t('header.settings.procedures.changeStationType.changeFrom'),
                    options: { any, ...kindOptions },
                    value: kindFrom,
                    onChange: value => setKindFrom(value as YaujStationKind | 'any'),
                },
                {
                    type: 'select',
                    label: t('header.settings.procedures.changeStationType.changeTo'),
                    options: kindOptions,
                    value: kindTo,
                    onChange: value => setKindTo(value as YaujStationKind),
                },
            ],
        },
        {
            id: 'offset',
            title: t('panel.details.stations.common.nameOffset'),
            toggle: () => setIsOffsetOn(on => !on),
            fields: [
                {
                    type: 'custom',
                    label: '',
                    component: <NameOffsetPad value={offset} onChange={setOffset} />,
                },
            ],
        },
        {
            id: 'rotate',
            title: t('panel.details.stations.common.rotate'),
            toggle: () => setIsRotateOn(on => !on),
            fields: [{ type: 'custom', label: '', component: <RotatePad value={rotate} onChange={setRotate} /> }],
        },
        {
            id: 'lineStyle',
            title: t('header.settings.procedures.changeLineStyleType.title'),
            toggle: () => setIsLineStyleOn(on => !on),
            fields: [
                {
                    type: 'select',
                    label: t('header.settings.procedures.changeLineStyleType.changeFrom'),
                    options: { any, ...lineStyleOptions },
                    value: styleFrom,
                    onChange: value => setStyleFrom(value as LineStyleType | 'any'),
                },
                {
                    type: 'select',
                    label: t('header.settings.procedures.changeLineStyleType.changeTo'),
                    options: targetLineStyleOptions,
                    value: styleTo,
                    disabledOptions: [styleFrom, ...disabledTargetLineStyles],
                    onChange: value => setStyleTo(value as LineStyleType),
                },
            ],
        },
        {
            id: 'color',
            title: t('header.settings.procedures.changeColor.title'),
            toggle: () => setIsColorOn(on => !on),
            fields: [
                {
                    type: 'custom',
                    label: t('header.settings.procedures.changeColor.changeFrom'),
                    component: (
                        <RmgAutoComplete
                            data={themeList}
                            displayHandler={item => (
                                <RmgLineBadge
                                    name={item.value}
                                    fg={item.theme[3]}
                                    bg={item.theme[2]}
                                    title={item.theme[1]}
                                    sx={{ display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                />
                            )}
                            filter={(query, item) => item.id.toLowerCase().includes(query.toLowerCase())}
                            value={colorFrom.value}
                            onChange={item => setColorFrom(item)}
                        />
                    ),
                },
                {
                    type: 'custom',
                    label: t('header.settings.procedures.changeColor.changeTo'),
                    component: <ThemeButton theme={newTheme} onClick={requestThemeChange} />,
                },
            ],
        },
    ];

    const handleApply = async () => {
        const useStations = !filter || filter.includes('station');
        const stations = (
            useStations
                ? isSelect
                    ? [...selected].filter(node => node.startsWith('stn'))
                    : graph.current.filterNodes(node => node.startsWith('stn'))
                : []
        ) as StnId[];
        const miscNodes = (
            !filter || filter.includes('misc-node')
                ? isSelect
                    ? [...selected].filter(node => node.startsWith('misc_node'))
                    : graph.current.filterNodes(node => node.startsWith('misc_node'))
                : []
        ) as MiscNodeId[];
        const lines = (
            !filter || filter.includes('line')
                ? isSelect
                    ? [...selected].filter(edge => edge.startsWith('line'))
                    : graph.current.edges()
                : []
        ) as LineId[];

        if (isKindOn || isOffsetOn || isRotateOn) {
            changeYaujStationsInBatch(graph.current, stations, {
                kindFrom: isKindOn ? kindFrom : undefined,
                kind: isKindOn ? kindTo : undefined,
                nameOffsetX: isOffsetOn ? offset.x : undefined,
                nameOffsetY: isOffsetOn ? offset.y : undefined,
                rotate: isRotateOn ? rotate : undefined,
            });
        }
        const changedLines: LineId[] = [];
        if (isLineStyleOn) {
            changedLines.push(
                ...changeLineStyleTypeInBatch(
                    graph.current,
                    styleFrom,
                    styleTo,
                    newTheme,
                    lines,
                    mapEnabled,
                    activeSubscriptions.RMP_CLOUD
                )
            );
        }
        if (isColorOn) {
            const from = colorFrom.id === 'any' ? 'any' : colorFrom.theme;
            changedLines.push(...changeLinesColorInBatch(graph.current, from, newTheme, lines));
            changeNodesColorInBatch(graph.current, from, newTheme, stations, miscNodes);
        }
        normalizeEdgeAttributes(graph.current, changedLines);
        dispatch(saveGraph(graph.current.export()));
        await dispatch(refreshEdgesThunk()).unwrap();
        await dispatch(refreshNodesThunk()).unwrap();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Text as="b" fontSize="xl">
                        {t('header.settings.procedures.yaujChange.title')}
                    </Text>
                    <ModalCloseButton />
                </ModalHeader>
                <ModalBody>
                    <Text fontSize="sm" mb="2">
                        {isSelect
                            ? t('header.settings.procedures.yaujChange.scopeSelected')
                            : t('header.settings.procedures.yaujChange.scopeAll')}
                    </Text>
                    <Accordion allowMultiple>
                        {sections.map(section => (
                            <AccordionItem key={section.id}>
                                <AccordionButton onClick={section.toggle}>
                                    <Box as="span" flex="1" textAlign="left">
                                        <Text as="b" fontSize="md">
                                            {section.title}
                                        </Text>
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                                <AccordionPanel pb={4}>
                                    <RmgFields fields={section.fields} minW={270} />
                                </AccordionPanel>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button
                        colorScheme="red"
                        mr="1"
                        onClick={handleApply}
                        isDisabled={!isKindOn && !isOffsetOn && !isRotateOn && !isLineStyleOn && !isColorOn}
                    >
                        {t('apply')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
