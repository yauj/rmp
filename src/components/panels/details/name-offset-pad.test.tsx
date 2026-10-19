import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '../../../test-utils';
import { NameOffsetPad } from './name-offset-pad';

describe('NameOffsetPad', () => {
    it('marks the current side and reports a click', () => {
        const onChange = vi.fn();
        render(<NameOffsetPad value={{ x: 'right', y: 'top' }} onChange={onChange} />);
        expect(screen.getByText('Name offset')).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(8);
        expect(screen.getByRole('button', { name: 'Top Right' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Bottom' })).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(screen.getByRole('button', { name: 'Bottom' }));
        expect(onChange).toHaveBeenCalledWith({ x: 'middle', y: 'bottom' });
        fireEvent.click(screen.getByRole('button', { name: 'Left' }));
        expect(onChange).toHaveBeenCalledWith({ x: 'left', y: 'middle' });
    });

    it('marks no side for a custom (dragged) name position', () => {
        render(<NameOffsetPad value={undefined} onChange={vi.fn()} />);
        screen.getAllByRole('button').forEach(button => expect(button).toHaveAttribute('aria-pressed', 'false'));
    });
});
