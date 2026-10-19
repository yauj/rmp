import { Box, Grid, IconButton, Text } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

// Row by row, top to bottom: the angle (clockwise from "to the right", as the icons are rotated) of each button around the
// pad. The middle of the pad is the label.
const CELLS: (number | undefined)[] = [225, 270, 315, 180, undefined, 0, 135, 90, 45];

/** The interchange blob a Yauj station is drawn as: the station circle and the next circle joined to it, pointing at `angle`. */
const BlobIcon = (props: { angle: number }) => {
    const rad = (props.angle * Math.PI) / 180;
    const tip = { x: 12 + 8 * Math.cos(rad), y: 12 + 8 * Math.sin(rad) };
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" focusable={false} aria-hidden>
            <line x1="12" y1="12" x2={tip.x} y2={tip.y} stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3.6" fill="currentColor" />
            <circle cx={tip.x} cy={tip.y} r="2.6" fill="currentColor" />
        </svg>
    );
};

/**
 * Picks the rotation of a station icon in steps of 45°: "Icon rotation" in the middle and, around it, one button per angle
 * showing the interchange blob pointing that way. The button of the current rotation is filled in; a rotation that is not a
 * multiple of 45° (set with the slider on a map) marks nothing.
 */
export const RotatePad = (props: { value: number; onChange: (angle: number) => void; isDisabled?: boolean }) => {
    const { value, onChange, isDisabled } = props;
    const { t } = useTranslation();
    const current = ((Math.round(value) % 360) + 360) % 360;
    const isCurrent = (angle: number) => Number.isInteger(value) && current === angle;

    return (
        <Grid
            templateColumns="repeat(3, 1fr)"
            gap="1"
            width="100%"
            maxW="180px"
            alignItems="center"
            justifyItems="center"
        >
            {CELLS.map((angle, i) =>
                angle === undefined ? (
                    <Box key={i} textAlign="center" lineHeight="1.1">
                        <Text fontSize="xs">{t('panel.details.stations.common.rotate')}</Text>
                    </Box>
                ) : (
                    <IconButton
                        key={i}
                        size="sm"
                        width="100%"
                        icon={<BlobIcon angle={angle} />}
                        aria-label={`${angle}°`}
                        aria-pressed={isCurrent(angle)}
                        colorScheme={isCurrent(angle) ? 'blue' : undefined}
                        variant={isCurrent(angle) ? 'solid' : 'outline'}
                        isDisabled={isDisabled}
                        onClick={() => onChange(angle)}
                    />
                )
            )}
        </Grid>
    );
};
