import {
    Badge,
    Button,
    HStack,
    IconButton,
    Input,
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverTrigger,
} from '@chakra-ui/react';
import { RmgAutoComplete, RmgLabel } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';
import { Id, NodeId, StnId } from '../../constants/constants';
import { StationAttributes } from '../../constants/stations';
import { useRootDispatch } from '../../redux';
import { setSvgViewBoxMin, setSvgViewBoxZoom } from '../../redux/param/param-slice';
import { setSelected } from '../../redux/runtime/runtime-slice';
import { getCanvasSize, pointerPosToSVGCoord } from '../../util/helpers';
import { useWindowSize } from '../../util/hooks';

/** Reads "325,-50", "(325, -50)" or "325 -50" as a point on the canvas. */
export const parseCoordinate = (text: string): { x: number; y: number } | undefined => {
    const numbers = text.match(/-?\d+(?:\.\d+)?/g);
    if (!numbers || numbers.length !== 2) return undefined;
    return { x: Number(numbers[0]), y: Number(numbers[1]) };
};

interface SearchData {
    id: StnId;
    value: string;
}

export const SearchPopover = () => {
    const [isOpen, setIsOpen] = React.useState(false);

    const { t } = useTranslation();
    const dispatch = useRootDispatch();
    const graph = React.useRef(window.graph);

    const size = useWindowSize();
    const { width, height } = getCanvasSize(size);

    const [data, setData] = React.useState<SearchData[]>([]);
    React.useEffect(() => {
        if (isOpen) {
            setData(
                graph.current
                    .nodes()
                    .filter(node => node.startsWith('stn'))
                    .map(stnId => {
                        const attr = graph.current.getNodeAttributes(stnId);
                        const type = attr.type;
                        const name = (attr[type] as StationAttributes).names.join('/');
                        return { id: stnId, value: name } as SearchData;
                    })
            );
        }
    }, [isOpen]);

    const centerOn = (target: { x: number; y: number }) => {
        const newSvgViewBoxZoom = Math.max(0, Math.min(400, -0.132 * height + 117.772));
        const { x, y } = pointerPosToSVGCoord((width - 300) / 2, height / 2, newSvgViewBoxZoom, {
            x: -target.x,
            y: -target.y,
        });
        dispatch(setSvgViewBoxZoom(newSvgViewBoxZoom));
        dispatch(setSvgViewBoxMin({ x: -x, y: -y }));
    };

    const moveCanvas = (stnId: StnId) => {
        dispatch(setSelected(new Set([stnId])));
        centerOn({
            x: graph.current.getNodeAttribute(stnId, 'x'),
            y: graph.current.getNodeAttribute(stnId, 'y'),
        });
    };

    const [coordinate, setCoordinate] = React.useState('');
    const point = parseCoordinate(coordinate);
    const goToCoordinate = () => {
        if (!point) return;
        // select whatever sits exactly there (a station or node), so it is easy to spot
        const here = graph.current
            .nodes()
            .filter(
                node =>
                    graph.current.getNodeAttribute(node, 'x') === point.x &&
                    graph.current.getNodeAttribute(node, 'y') === point.y
            );
        dispatch(setSelected(new Set<Id>(here as NodeId[])));
        centerOn(point);
    };

    return (
        <Popover isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
            <PopoverTrigger>
                <IconButton
                    aria-label="zoom"
                    variant="ghost"
                    size="sm"
                    icon={<MdSearch />}
                    onClick={() => setIsOpen(!isOpen)}
                />
            </PopoverTrigger>
            <PopoverContent>
                <PopoverBody>
                    <RmgLabel label={t('header.search')}>
                        <RmgAutoComplete
                            data={data}
                            displayHandler={item => <Badge>{item.value}</Badge>}
                            filter={(query, item) =>
                                item.value.toLowerCase().includes(query.toLowerCase()) ||
                                Object.values(item.value).some(name => name.toLowerCase().includes(query.toLowerCase()))
                            }
                            value=""
                            onChange={item => moveCanvas(item.id)}
                        />
                    </RmgLabel>
                    <RmgLabel label={t('header.searchCoordinate.label')}>
                        <HStack>
                            <Input
                                size="sm"
                                value={coordinate}
                                placeholder={t('header.searchCoordinate.placeholder')}
                                isInvalid={coordinate.trim() !== '' && !point}
                                onChange={event => setCoordinate(event.target.value)}
                                onKeyDown={event => event.key === 'Enter' && goToCoordinate()}
                            />
                            <Button size="sm" isDisabled={!point} onClick={goToCoordinate}>
                                {t('header.searchCoordinate.go')}
                            </Button>
                        </HStack>
                    </RmgLabel>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
};
