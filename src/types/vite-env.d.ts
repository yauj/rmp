/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
    /** yauj branch, local only: "1" makes the app behave as a subscriber. */
    readonly VITE_YAUJ_PRO?: string;
}
