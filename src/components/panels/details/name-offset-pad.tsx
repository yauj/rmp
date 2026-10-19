import { Box, Grid, IconButton, Text } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    MdArrowBack,
    MdArrowDownward,
    MdArrowForward,
    MdArrowUpward,
    MdNorthEast,
    MdNorthWest,
    MdSouthEast,
    MdSouthWest,
} from 'react-icons/md';
import { NameOffsetX, NameOffsetY } from '../../../constants/stations';

export interface NameOffset {
    x: NameOffsetX;
    y: NameOffsetY;
}

// Row by row, top to bottom. The middle of the pad is the label: a name on top of the icon is not an offset.
const CELLS: ({ x: NameOffsetX; y: NameOffsetY; icon: React.ReactElement } | undefined)[] = [
    { x: 'left', y: 'top', icon: <MdNorthWest /> },
    { x: 'middle', y: 'top', icon: <MdArrowUpward /> },
    { x: 'right', y: 'top', icon: <MdNorthEast /> },
    { x: 'left', y: 'middle', icon: <MdArrowBack /> },
    undefined,
    { x: 'right', y: 'middle', icon: <MdArrowForward /> },
    { x: 'left', y: 'bottom', icon: <MdSouthWest /> },
    { x: 'middle', y: 'bottom', icon: <MdArrowDownward /> },
    { x: 'right', y: 'bottom', icon: <MdSouthEast /> },
];

/**
 * Picks which side of a station its name goes on: "Name offset" in the middle, an arrow button for each of the 8 sides.
 * The button of the current offset is filled in. Pass `value` undefined when the name sits at a custom (dragged) position,
 * so no side is marked.
 */
export const NameOffsetPad = (props: {
    value: NameOffset | undefined;
    onChange: (offset: NameOffset) => void;
    isDisabled?: boolean;
}) => {
    const { value, onChange, isDisabled } = props;
    const { t } = useTranslation();
    const word = (side: NameOffsetX | NameOffsetY) => t(`panel.details.stations.common.${side}`);

    return (
        <Grid
            templateColumns="repeat(3, 1fr)"
            gap="1"
            width="100%"
            maxW="180px"
            alignItems="center"
            justifyItems="center"
        >
            {CELLS.map((cell, i) =>
                cell ? (
                    <IconButton
                        key={i}
                        size="sm"
                        width="100%"
                        icon={cell.icon}
                        aria-label={[word(cell.y), word(cell.x)]
                            .filter((_, k) => (k === 0 ? cell.y !== 'middle' : cell.x !== 'middle'))
                            .join(' ')}
                        aria-pressed={value?.x === cell.x && value?.y === cell.y}
                        colorScheme={value?.x === cell.x && value?.y === cell.y ? 'blue' : undefined}
                        variant={value?.x === cell.x && value?.y === cell.y ? 'solid' : 'outline'}
                        isDisabled={isDisabled}
                        onClick={() => onChange({ x: cell.x, y: cell.y })}
                    />
                ) : (
                    <Box key={i} textAlign="center" lineHeight="1.1">
                        <Text fontSize="xs">{t('panel.details.stations.common.nameOffset')}</Text>
                    </Box>
                )
            )}
        </Grid>
    );
};
