import fs from 'node:fs';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { StationType } from '../../../constants/stations';
import { render as renderWithProviders } from '../../../test-utils';
import stations from './stations';
import { YaujStationAttributes } from './yauj-station';

const yaujStation = stations[StationType.Yauj];
const Station = yaujStation.component;

const interchange = (color: string, status?: string) =>
    ['hongkong', 'x', color, '#fff', '', '', ...(status ? [status] : [])] as YaujStationAttributes['transfer'][0][0];

const renderStation = (patch: Partial<YaujStationAttributes>, x = 0) => {
    const attrs = { ...structuredClone(yaujStation.defaultAttrs), ...patch };
    return renderWithProviders(
        <svg>
            <Station
                id="stn_test"
                x={x}
                y={0}
                attrs={{ [StationType.Yauj]: attrs }}
                handlePointerDown={vi.fn()}
                handlePointerMove={vi.fn()}
                handlePointerUp={vi.fn()}
            />
        </svg>
    );
};

const texts = (container: HTMLElement) => Array.from(container.querySelectorAll('text')).map(n => n.textContent);
const dashedCircles = (container: HTMLElement) => container.querySelectorAll('circle[stroke-dasharray]');

describe('YaujStation', () => {
    it('draws the name for an in-service station', () => {
        const { container } = renderStation({ names: ['深圳', 'Shenzhen'] });
        expect(texts(container)).toEqual(['深圳', 'Shenzhen']);
        expect(dashedCircles(container)).toHaveLength(0);
    });

    it.each([
        ['construction', '(施工封闭)', '(U/C)'],
        ['closed', '(暂缓开通)', '(Closed)'],
    ] as const)('hides the name of a %s station and shows the status label', (kind, zh, en) => {
        const { container } = renderStation({ kind, names: ['深圳', 'Shenzhen'] });
        expect(texts(container)).toEqual([zh, en]);
        expect(dashedCircles(container)).toHaveLength(1);
    });

    it('draws a light rail terminus in the line colour, without a label when it has no name', () => {
        const { container } = renderStation({ kind: 'lightRailTerminus', names: ['', ''] });
        expect(texts(container)).toEqual([]);
        expect(container.querySelector('circle')).toHaveAttribute('stroke', '#007549');
    });

    it('never labels a light rail terminus, even when it has names', () => {
        const { container } = renderStation({ kind: 'lightRailTerminus', names: ['終點', 'End'] });
        expect(texts(container)).toEqual([]);
    });

    it('draws the under-construction light rail terminus as a small dotted circle without a label', () => {
        const { container } = renderStation({ kind: 'lightRailTerminusConstruction', names: ['終點', 'End'] });
        const circle = container.querySelector('circle')!;
        expect(texts(container)).toEqual([]);
        expect(circle).toHaveAttribute('r', '2.5');
        expect(circle).toHaveAttribute('stroke', '#007549');
        expect(circle).toHaveAttribute('stroke-dasharray', '1 1');
    });

    it.each([
        ['construction', '(施工封闭)', '(U/C)'],
        ['closed', '(暂缓开通)', '(Closed)'],
    ] as const)('shows the %s label when every interchange line is %s', (status, zh, en) => {
        const { container } = renderStation({
            names: ['車站', 'Stn'],
            transfer: [[interchange('#f00', status), interchange('#00f', status)]],
        });
        expect(texts(container)).toEqual([zh, en]);
    });

    it('keeps the station name while one interchange line is open', () => {
        const { container } = renderStation({
            names: ['車站', 'Stn'],
            transfer: [[interchange('#f00'), interchange('#00f', 'construction')]],
        });
        expect(texts(container)).toEqual(['車站', 'Stn']);
    });

    it('draws the line-coloured terminus with a coloured border and a white fill', () => {
        const { container } = renderStation({ kind: 'lineColor', names: ['終點', 'End'] });
        const circle = container.querySelector('circle')!;
        expect(circle).toHaveAttribute('stroke', '#007549');
        expect(circle).toHaveAttribute('fill', 'white');
        expect(circle).toHaveAttribute('r', '5');
        expect(texts(container)).toEqual(['終點', 'End']);
    });

    it('merges open lines into one pill with a tick per line', () => {
        const { container } = renderStation({ transfer: [[interchange('#f00'), interchange('#00f')]] });
        expect(dashedCircles(container)).toHaveLength(0);
        expect(container.querySelectorAll('line')).toHaveLength(2);
    });

    it.each(['closed', 'construction'])('draws an empty circle plus a dotted circle for a %s line', status => {
        const { container } = renderStation({ transfer: [[interchange('#f00'), interchange('#00f', status)]] });
        const circles = Array.from(container.querySelectorAll('circle'));
        expect(circles.filter(c => c.hasAttribute('stroke-dasharray')).map(c => c.getAttribute('cx'))).toEqual(['5']);
        expect(circles.filter(c => c.getAttribute('stroke') === '#001f50')).toHaveLength(1);
        expect(container.querySelectorAll('line')).toHaveLength(0);
    });

    it('overlaps a dotted circle with its open neighbours', () => {
        const { container } = renderStation({
            transfer: [[interchange('#f00'), interchange('#0a0', 'construction'), interchange('#00f')]],
        });
        const circles = Array.from(container.querySelectorAll('circle[cx]'));
        const dashed = circles.filter(c => c.hasAttribute('stroke-dasharray'));
        const borders = circles.filter(c => c.getAttribute('stroke') === '#001f50');
        expect(dashed.map(c => c.getAttribute('cx'))).toEqual(['5']);
        expect(borders.map(c => c.getAttribute('cx'))).toEqual(['0', '10']);
        expect(container.querySelectorAll('line')).toHaveLength(2);
    });

    it('draws further dotted circles below the closer ones', () => {
        const { container } = renderStation({
            transfer: [[interchange('#f00'), interchange('#0a0', 'construction'), interchange('#00f', 'construction')]],
        });
        const dashed = Array.from(container.querySelectorAll('circle[stroke-dasharray]'));
        // Later in the document means drawn on top, so the further circle comes first.
        expect(dashed.map(c => c.getAttribute('cx'))).toEqual(['10', '5']);
    });

    it('draws a terminus line with a border in its colour', () => {
        const { container } = renderStation({
            transfer: [[interchange('#f00'), interchange('#00f', 'terminus')]],
        });
        const strokes = Array.from(container.querySelectorAll('circle[fill="none"]')).map(c =>
            c.getAttribute('stroke')
        );
        expect(strokes).toEqual(['#001f50', '#00f']);
    });

    it('can dump a sheet of every variant', () => {
        if (!process.env.YAUJ_SHEET) return;
        const two = [interchange('#f00'), interchange('#00f')];
        const diag = (nameOffsetX: any, nameOffsetY: any): Partial<YaujStationAttributes> => ({
            names: ['車站', 'Stn'],
            nameOffsetX,
            nameOffsetY,
        });
        const variants: Partial<YaujStationAttributes>[] = [
            diag('left', 'top'),
            diag('right', 'top'),
            diag('left', 'bottom'),
            diag('right', 'bottom'),
            { kind: 'construction', nameOffsetX: 'right', nameOffsetY: 'top' },
            { names: ['車站', 'Stn'] },
            { names: ['車站', 'Stn'], transfer: [two] },
            { names: ['車站', 'Stn'], transfer: [[...two, interchange('#0a0')]] },
            { names: ['車站', 'Stn'], transfer: [[interchange('#f00'), interchange('#00f', 'closed')]] },
            { names: ['車站', 'Stn'], transfer: [[interchange('#f00'), interchange('#00f', 'terminus')]] },
            {
                names: ['車站', 'Stn'],
                transfer: [[interchange('#f00'), interchange('#0a0', 'construction'), interchange('#00f')]],
            },
            { kind: 'construction' },
            { kind: 'closed' },
            { kind: 'lineColor', names: ['終點', 'End'] },
            { kind: 'lightRailTerminus', names: ['', ''] },
        ];
        const inner = variants
            .map((v, i) => {
                const { container } = renderStation(v);
                return `<g transform="translate(${50 + (i % 5) * 95} ${60 + Math.floor(i / 5) * 100})">${container.querySelector('svg')!.innerHTML}</g>`;
            })
            .join('');
        fs.writeFileSync(
            process.env.YAUJ_SHEET,
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 240" width="1040" height="480"><rect width="520" height="240" fill="white"/>${inner}</svg>`
        );
    });
});
