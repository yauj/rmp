/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';

/**
 * Dev-only: lets the app list, read and write files in yauj/saves so Jeremy can
 * open and export saves with the "yauj" menu.
 * Only plain *.json / *.svg file names are accepted (no path traversal).
 */
const yaujSaves = (): Plugin => {
    const dir = path.resolve(__dirname, 'yauj/saves');
    const valid = (name: string) => /^[\w.\- ]+\.(json|svg)$/i.test(name) && !name.includes('..');
    return {
        name: 'yauj-saves',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const match = req.url?.match(/^(?:\/rmp)?\/__yauj\/saves(?:\/([^?]*))?/);
                if (!match) return next();
                const name = match[1] ? decodeURIComponent(match[1]) : '';
                fs.mkdirSync(dir, { recursive: true });
                if (!name && req.method === 'GET') {
                    const files = fs
                        .readdirSync(dir)
                        .filter(valid)
                        .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
                        .sort((a, b) => b.mtime - a.mtime);
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify(files));
                }
                if (!valid(name)) {
                    res.statusCode = 400;
                    return res.end('Invalid file name');
                }
                if (req.method === 'GET') {
                    if (!fs.existsSync(path.join(dir, name))) {
                        res.statusCode = 404;
                        return res.end();
                    }
                    return res.end(fs.readFileSync(path.join(dir, name)));
                }
                if (req.method === 'PUT') {
                    const chunks: Buffer[] = [];
                    req.on('data', c => chunks.push(c));
                    req.on('end', () => {
                        fs.writeFileSync(path.join(dir, name), Buffer.concat(chunks));
                        res.end('ok');
                    });
                    return;
                }
                res.statusCode = 405;
                res.end();
            });
        },
    };
};

// https://vitejs.dev/config
export default defineConfig({
    base: '/rmp/',
    optimizeDeps: {
        exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
    },
    plugins: [
        react(),
        svgr(),
        yaujSaves(),
        ...(process.env.VITEST
            ? []
            : [checker({ typescript: true, eslint: { lintCommand: 'eslint ./src', useFlatConfig: true } })]),
        visualizer({ filename: 'dist/bundle-report.html', gzipSize: true }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom', '@reduxjs/toolkit', 'react-redux', 'react-i18next'],
                    chakra: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion', 'react-icons'],
                },
            },
        },
    },
    server: {
        proxy: {
            '^(/styles/|/fonts/|/rmg/|/rmg-palette/|/rmp-gallery/)': {
                target: 'https://railmapgen.org',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        server: {
            deps: {
                fallbackCJS: false,
            },
        },
        watch: false,
    },
});
