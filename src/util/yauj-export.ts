import { useToast } from '@chakra-ui/react';
import React from 'react';
import { useRootSelector } from '../redux';
import { makeRenderReadySVGElement, shouldForceRmpInfo, writeYaujSave } from './download';
import { imageStoreIndexedDB } from './image-store-indexed-db';
import { stringifyParam } from './save';

const FILE_NAME = /^RailMapToolkit_(.+)_(\d{8})\.json$/i;
const MAP_DATE_TEXT = /^\(?\s*(\d{4})-(\d{2})-(\d{2})\s*\)?$/;

/** File name of the last project opened from disk (file picker or yauj import), if any. */
let loadedName: string | undefined;
export const setYaujLoadedName = (name: string | undefined) => {
    loadedName = name;
};

/** Region part of the last opened `RailMapToolkit_<Region>_<YYYYMMDD>.json`, or the bare name for other files. */
export const getYaujDefaultRegion = (): string => {
    if (!loadedName) return '';
    return loadedName.match(FILE_NAME)?.[1] ?? loadedName.replace(/\.json$/i, '');
};

/** The map's own "as of" date: the yauj map title's date, or a text node reading e.g. "(2026-07-31)". Returned as YYYYMMDD. */
export const findMapDate = (graph: {
    forEachNode: (cb: (id: string, attr: any) => void) => void;
}): string | undefined => {
    let found: string | undefined;
    graph.forEachNode((_, attr) => {
        const content =
            attr?.type === 'text'
                ? attr.text?.content
                : attr?.type === 'yauj-map-title'
                  ? attr['yauj-map-title']?.date
                  : undefined;
        const m = String(content ?? '').match(MAP_DATE_TEXT);
        if (m) found ??= `${m[1]}${m[2]}${m[3]}`;
    });
    return found;
};

export const formatYaujDate = (d = new Date()) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

export const yaujBaseName = (region: string, date: string) => `RailMapToolkit_${region}_${date}`;

/** Exports the project .json and an SVG 2.0 (the Download dialog's defaults) into yauj/saves. */
export const useYaujExport = () => {
    const toast = useToast();
    const param = useRootSelector(state => state.param);
    const { languages } = useRootSelector(state => state.fonts);
    const { existsNodeTypes } = useRootSelector(state => state.runtime);
    const {
        activeSubscriptions: { RMP_EXPORT },
    } = useRootSelector(state => state.account);

    return React.useCallback(
        async (region: string, date: string) => {
            const graph = window.graph;
            const base = yaujBaseName(region, date);
            try {
                const images: { id: string; base64: string }[] = [];
                for (const id of graph.filterNodes(
                    (id: string, attr: any) =>
                        id.startsWith('misc_node') && attr.type === 'image' && attr['image']?.href !== undefined
                )) {
                    const attr = graph.getNodeAttributes(id)['image']!;
                    if (attr.href && attr.href.startsWith('img-l') && (await imageStoreIndexedDB.has(attr.href))) {
                        images.push({ id: attr.href, base64: (await imageStoreIndexedDB.get(attr.href))! });
                    }
                }
                const { elem } = await makeRenderReadySVGElement(
                    graph,
                    param.present.mapEnabled,
                    false,
                    false,
                    languages,
                    shouldForceRmpInfo(existsNodeTypes, RMP_EXPORT),
                    2
                );
                const svg = elem.outerHTML.replace(/&nbsp;/g, ' ').replace(/\p{Cc}/gu, '');

                await writeYaujSave(`${base}.json`, stringifyParam(param, images));
                await writeYaujSave(`${base}.svg`, svg);
                setYaujLoadedName(`${base}.json`);
                toast({ title: `Saved ${base}.json and .svg to yauj/saves`, status: 'success', duration: 4000 });
            } catch (err) {
                toast({ title: 'yauj export failed', description: String(err), status: 'error' });
            }
        },
        [param, languages, existsNodeTypes, RMP_EXPORT, toast]
    );
};
