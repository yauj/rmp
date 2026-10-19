import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '../../../test-utils';
import { RotatePad } from './rotate-pad';

describe('RotatePad', () => {
    it('marks the current angle and reports a click', () => {
        const onChange = vi.fn();
        render(<RotatePad value={90} onChange={onChange} />);
        expect(screen.getByText('Icon rotation')).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(8);
        expect(screen.getByRole('button', { name: '90°' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: '0°' })).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(screen.getByRole('button', { name: '315°' }));
        expect(onChange).toHaveBeenCalledWith(315);
    });

    it('marks nothing for an angle that is not a step of 45 degrees, and treats 360 as 0', () => {
        const { unmount } = render(<RotatePad value={100.5} onChange={vi.fn()} />);
        screen.getAllByRole('button').forEach(button => expect(button).toHaveAttribute('aria-pressed', 'false'));
        unmount();
        render(<RotatePad value={360} onChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: '0°' })).toHaveAttribute('aria-pressed', 'true');
    });
});
