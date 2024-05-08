import { renderers } from './renderers.mjs';
import { manifest } from './manifest_B2MjJAT-.mjs';
import * as serverEntrypointModule from '@astrojs/netlify/ssr-function.js';
import { onRequest } from './_noop-middleware.mjs';

const _page0 = () => import('./chunks/generic_Drgd5Ope.mjs');
const _page1 = () => import('./chunks/get-info-playlist_C17fwIsu.mjs');
const _page2 = () => import('./chunks/_id__Dy2UEFPn.mjs');
const _page3 = () => import('./chunks/index_BAWDfBg1.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/get-info-playlist.json.js", _page1],
    ["src/pages/playlist/[id].astro", _page2],
    ["src/pages/index.astro", _page3]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    renderers,
    middleware: onRequest
});
const _args = {
    "middlewareSecret": "ba15fc77-c547-4c2c-bce3-f7940ad2ab98"
};
const _exports = serverEntrypointModule.createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
