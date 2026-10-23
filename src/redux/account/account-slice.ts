import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ActiveSubscriptions {
    RMP_CLOUD: boolean;
    RMP_EXPORT: boolean;
}

/**
 * yauj branch, local only: VITE_YAUJ_PRO=1 (set in .env.development.local, which git ignores) makes this build behave as a
 * subscriber, whatever the login says. It lifts the limits the app applies on the client (parallel lines, master nodes,
 * line styles and paths, export watermark ...). Features that need the RMP server (cloud save, semantic translation) still
 * need a real login.
 */
export const isYaujPro = () => import.meta.env.VITE_YAUJ_PRO === '1';

export const defaultActiveSubscriptions: ActiveSubscriptions = {
    RMP_CLOUD: isYaujPro(),
    RMP_EXPORT: isYaujPro(),
};

/**
 * AccountState contains information of the current user.
 * Note login and management part should leave to rmg-home and only authenticate here.
 */
export interface AccountState {
    state: 'logged-out' | 'free' | 'subscriber' | 'expired';
    activeSubscriptions: ActiveSubscriptions;
    /**
     * Use this token to communicate with server.
     * Must be up to date as it is updated on storage event in onLocalStorageChangeRMT.
     * Undefined means not logged in.
     *
     * (Optional) If the subsequent request returns 401, call requestToken to refresh
     * it on RMT side, and then retry the request.
     */
    token: string | undefined;
}

export const initialState: AccountState = {
    state: 'logged-out',
    activeSubscriptions: defaultActiveSubscriptions,
    token: undefined,
};

const accountSlice = createSlice({
    name: 'account',
    initialState,
    reducers: {
        setState: (state, action: PayloadAction<AccountState['state']>) => {
            state.state = action.payload;
        },
        setActiveSubscriptions: (state, action: PayloadAction<ActiveSubscriptions>) => {
            state.activeSubscriptions = isYaujPro() ? { RMP_CLOUD: true, RMP_EXPORT: true } : action.payload;
        },
        setToken: (state, action: PayloadAction<string | undefined>) => {
            state.token = action.payload;
        },
    },
});

export const { setState, setActiveSubscriptions, setToken } = accountSlice.actions;
export default accountSlice.reducer;
