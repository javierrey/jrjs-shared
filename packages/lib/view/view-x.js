// lib/.../view-x.js, DOM
// _@ts-check

/**
@typedef {import('./view.js').PlainObject} PlainObject;
@typedef {import('./view.js').ViewContext} ViewContext;
*/

import {
  callFetch, insertHtml, rebaseLinks,
} from './view.js';

import {
  mdToHtml,
} from '../core/core-x.js';

export * from './view.js';
export * from '../core/core-x.js';

/* * */

/**
Loads content from a `url` and inserts it into an HTML parent element.
New scripts in the content are also loaded and run, unless `norun` is true.
*/
export const loadHtml = (url, parent = null, position = null, norun = false) => {
  const cb = (uri, cont, err) => {
    cont ??= '', cont = `\n<!--loadHtml "${uri}" "${cont.length}B" "${err ?? ''}"-->\n`
      + rebaseLinks(/\.md([?#]|$)/i.test(uri) ? mdToHtml(cont) : cont, uri)
      + `\n<!--/loadHtml-->\n`;
    insertHtml(cont, parent, position, norun);
  };
  callFetch(url, cb, 'text');
};

/* * */
