import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MultiDirectedGraph } from 'graphology';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EdgeAttributes, GraphAttributes, NodeAttributes } from '../../../constants/constants';
import { createStore } from '../../../redux';
import { render } from '../../../test-utils';
import { YaujChangeAttributeModal } from './yauj-change-attribute-modal';

const addStation = (
    graph: MultiDirectedGraph<NodeAttributes, EdgeAttributes, GraphAttributes>,
    id: string,
    kind: string
) =>
    graph.addNode(id, {
        visible: true,
        zIndex: 0,
        x: 0,
        y: 0,
        type: 'yauj-station',
        'yauj-station': {
            names: ['a', 'b'],
            kind,
            nameOffsetX: 'right',
            nameOffsetY: 'top',
            transfer: [[]],
            rotate: 0,
        },
    } as any);

vi.mock('../../panels/theme-button', () => ({
    default: () => <button type="button" aria-label="Color" />,
}));

describe('YaujChangeAttributeModal', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockReturnValue({
                matches: false,
                media: '',
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
            })
        );
    });

    it('changes the station type and name offset of the selected stations only', async () => {
        const graph = new MultiDirectedGraph<NodeAttributes, EdgeAttributes, GraphAttributes>();
        addStation(graph, 'stn_one', 'normal');
        addStation(graph, 'stn_two', 'normal');
        window.graph = graph;
        const store = createStore();
        const { setSelected } = await import('../../../redux/runtime/runtime-slice');
        store.dispatch(setSelected(new Set(['stn_one'] as any)));
        const onClose = vi.fn();

        render(<YaujChangeAttributeModal isOpen={true} onClose={onClose} isSelect={true} />, { store });
        const apply = screen.getByRole('button', { name: 'Apply' });
        expect(apply).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: /Change Yauj station type in batch/ }));
        const kindPanel = screen.getAllByRole('combobox', { hidden: true });
        const to = kindPanel[1] as HTMLSelectElement;
        fireEvent.change(to, { target: { value: 'construction' } });
        fireEvent.click(screen.getByRole('button', { name: 'Name offset' }));
        fireEvent.click(screen.getByRole('button', { name: 'Bottom Left', hidden: true }));
        expect(apply).toBeEnabled();

        fireEvent.click(apply);
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        expect((graph.getNodeAttributes('stn_one') as any)['yauj-station'].kind).toBe('construction');
        expect((graph.getNodeAttributes('stn_one') as any)['yauj-station']).toMatchObject({
            nameOffsetX: 'left',
            nameOffsetY: 'bottom',
        });
        expect((graph.getNodeAttributes('stn_two') as any)['yauj-station'].kind).toBe('normal');
        expect((graph.getNodeAttributes('stn_two') as any)['yauj-station']).toMatchObject({
            nameOffsetX: 'right',
            nameOffsetY: 'top',
        });
    });
});
