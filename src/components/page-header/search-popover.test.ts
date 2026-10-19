import { describe, expect, it } from 'vitest';
import { parseCoordinate } from './search-popover';

describe('parseCoordinate', () => {
    it('reads the formats used in the update reports', () => {
        expect(parseCoordinate('325,-50')).toEqual({ x: 325, y: -50 });
        expect(parseCoordinate('(325, -50)')).toEqual({ x: 325, y: -50 });
        expect(parseCoordinate('-1980 3240')).toEqual({ x: -1980, y: 3240 });
        expect(parseCoordinate('12.5, 7')).toEqual({ x: 12.5, y: 7 });
    });
    it('rejects anything that is not two numbers', () => {
        expect(parseCoordinate('')).toBeUndefined();
        expect(parseCoordinate('325')).toBeUndefined();
        expect(parseCoordinate('1,2,3')).toBeUndefined();
        expect(parseCoordinate('abc')).toBeUndefined();
    });
});
