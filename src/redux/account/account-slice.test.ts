import { afterEach, describe, expect, it, vi } from 'vitest';

describe('yauj pro override', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('is off by default', async () => {
        const { default: reducer, setActiveSubscriptions, initialState } = await import('./account-slice');
        expect(initialState.activeSubscriptions).toEqual({ RMP_CLOUD: false, RMP_EXPORT: false });
        const next = reducer(initialState, setActiveSubscriptions({ RMP_CLOUD: false, RMP_EXPORT: false }));
        expect(next.activeSubscriptions).toEqual({ RMP_CLOUD: false, RMP_EXPORT: false });
    });

    it('acts as a subscriber with VITE_YAUJ_PRO=1, whatever the login says', async () => {
        vi.stubEnv('VITE_YAUJ_PRO', '1');
        vi.resetModules();
        const { default: reducer, setActiveSubscriptions, initialState } = await import('./account-slice');
        expect(initialState.activeSubscriptions).toEqual({ RMP_CLOUD: true, RMP_EXPORT: true });
        const next = reducer(initialState, setActiveSubscriptions({ RMP_CLOUD: false, RMP_EXPORT: false }));
        expect(next.activeSubscriptions).toEqual({ RMP_CLOUD: true, RMP_EXPORT: true });
    });
});
