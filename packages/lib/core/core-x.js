// lib/.../core-x.js
// _@ts-check

/**
@typedef {import('./core.js').PlainObject} PlainObject;
*/

import {
  isBin, isTra, toEmp, toSca, toStr, REX as REX_base,
} from './core.js';

export * from './core.js';

/* Types functionality: */

/** Converts a Node's buffer to an ArrayBuffer. @param {number[]} buffer, @return {ArrayBuffer} */
export const bufferToArrayBuffer = (buffer) => {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; i++) { view[i] = buffer[i]; }
  return arrayBuffer;
};

/** Builds a string sample from a content start, middle and end, up to a given size approximately. */
export const getSample = (content, size, info) => {
  content = toStr(content); size ??= 300;
  const length = content.byteLength ?? content.length ?? 0, range = ~~(size / 3);
  const r2 = range * 2, l_2 = ~~(length / 2), r_2 = ~~(range / 2);
  info = info ? `[${content?.constructor?.name} ${length}${isBin(content) ? 'B' : 'C'}] ` : '';
  return info + (
    (length > r2 ? content.slice(0, range) : content)
    + (length > size ? ' ... ' + content.slice(l_2 - r_2, l_2 + r_2) : '')
    + (length > r2 ? ' ... ' + content.slice(-range) : '')
  ).replace(/\s+/g, ' ');
};

/* String and RegExp transformations: */

/** Extends REX definition, replacing imported base core.REX. */
export const REX = (() => {
  /** RegExp for a decimal number. */
  const DECIMAL_NUMBER_RE = /[+-]?(?:\d+\.?\d*|\d*\.?\d+)(?:[eE][+-]?\d+)?/g;

  /**
  Gets a RegExp for a decimal number that is not part of a word,
  including optional character prefixes.
  */
  const getDecimalNumberInContextRE = (chars = '') => new RegExp(
    `[+-]?(?<=^|[^\\w${chars}])(?:\\d+\\.?\\d*|\\d*\\.?\\d+)(?:[eE][+-]?\\d+)?(?=[^\\w]|$)`, 'g'
  );

  /** Trims all lines in a text. */
  const trimLines = (text) => text.replace(/\s*\n\s*/g, '\n').trim();

  /** Removes empty lines and multiple spaces. */
  const removeEmptySpaces = (text) => text.replace(/\s*\n+\s*/g, '\n').replace(/(\n|\s){2,}/g, '$1').trim();

  /** constructor method */
  const main = (text) => Object.freeze({
    ...REX_base(text),
    trimLines: () => trimLines(text),
    removeEmptySpaces: () => removeEmptySpaces(text),
  });

  /** public static members */
  const members = {
    ...REX_base,
    DECIMAL_NUMBER_RE, getDecimalNumberInContextRE,
    // Also implemented in instance version:
    trimLines, removeEmptySpaces,
  };

  return Object.freeze(Object.assign(main, members));
})();

/**
Returns a random string of a certain length.
Default `length`: 11, `base`: 36, which generates an alphanumeric output in a single seed iteration.
Useful `base` alphabet sets: 2 (binary), 10 (decimal), 16 (hexadecimal), 36 (alphanumeric).
*/
export const getRandomString = (length = 11, base = 36) => {
  let str = ''; while (str.length < length) str += Math.random().toString(base).slice(2);
  return str.slice(-length);
};

/* Object transformations and String parsers: */

/**
Clones a plain object or array recursively. Other object types are assigned by reference.
Same as method `clone`, but the behaviour is configurable and avoids cyclic redundancy.
Returns a cloned object, or the object itself if it is not clonable.
The `opt` parameter can be null or an array with property names and object references
that will be treated as direct values, rather than traversed recursively.
To create a shallow copy of the source object, use `Object.assign` instead.
*/
export const customClone = (opt, obj) => {
  const isObj = (v) => !!v && [Object, undefined].includes(v.constructor);
  const isTra = (v) => isObj(v) || !!v?.every?.(isObj);
  const map = (v) => typeof v?.slice === 'function' && !v.substring ? v.slice() : v;
  if (!isTra(obj)) { return map(obj); }
  const x = {
    keys: new Set(opt?.filter((v) => v?.constructor === String) || []),
    refs: new WeakSet(opt?.filter((v) => isTra(v)) || []),
  };
  const had = (v, k) => { const h = x.refs.has(v) || x.keys.has(k); x.refs.add(v); return h; };
  const emp = (v) => typeof v?.join === 'function' ? [] : {};
  const travel = (t, s) => Object.entries(s).forEach(([k, v]) => {
    if (isTra(v) && !had(v, k)) { t[k] = emp(v); travel(t[k], v); }
    else if (v === obj) { t[k] = tgt; } else if (v === s) { t[k] = t; } else { t[k] = map(v); }
  });
  const tgt = emp(obj); had(obj); had(globalThis); travel(tgt, obj);
  return tgt;
};

/**
Remaps an object or array recursively calling a mapping function on each non-traversable property.
Same as method `remap`, but the behaviour is configurable and avoids cyclic redundancy.
The `opt` parameter can be null or an array with property names and object references
that will be treated as direct values, rather than traversed recursively.
The `map` function parameter performs a mapping operation on each non-traversable property.
It must accept a parent object and a property key. It doesn't need to return anything.
To prevent the mutation of the orignal object, use a clone: `customRemap(null, customClone(null, obj), map)`.
*/
export const customRemap = (opt, obj, map) => {
  const isObj = (v) => !!v && [Object, undefined].includes(v.constructor);
  const isTra = (v) => isObj(v) || !!v?.every?.(isObj);
  const x = {
    keys: new Set(opt?.filter((v) => v?.constructor === String) || []),
    refs: new WeakSet(opt?.filter((v) => isTra(v)) || []),
  };
  const had = (v, k) => { const h = x.refs.has(v) || x.keys.has(k); x.refs.add(v); return h; };
  const travel = (o) => Object.entries(o)
    .forEach(([k, v]) => isTra(v) ? !had(v, k) && travel(v) : map(o, k, obj));
  if (map instanceof Function && isTra(obj)) { had(obj); had(globalThis); travel(obj); }
  return obj;
};

/**
Updates the content of a target object with properties from one or more source objects recursively.
Same as method `merge`, but the behaviour is configurable and avoids cyclic redundancy.
Both target and source parameters should be plain objects.
The `opt` parameter can be null or an object with `mode` and `exclude` options.
The `mode` option may be: 0 (`clean`), 1 (`assign`), 2 (`overwrite`) and 3 (`extend`).
The `clean` mode modifies existing properties and creates new properties in the target,
but also removes properties, when the matching property name in the source has value `undefined`.
The `assign` mode does the same as `clean`, but doesn't remove properties from the target.
The `overwrite` mode can update target properties but cannot create new ones.
The `extend` mode can create new properties in the target but cannot modify existing defined values.
The `exclude` option array may contain property names and object references that will be treated as direct
values, rather than traversed recursively.
e.g. `const mergeFunc = (tgt, ...srcs) => customMerge({ mode: 1, exclude: ['parent', this] }, tgt, ...srcs);`
To prevent the mutation of the orignal target, use a clone: `customMerge(null, customClone(null, tgt), ...srcs);`.
*/
export const customMerge = (opt, tgt, ...srcs) => {
  if (typeof opt === 'number') { opt = { mode: opt }; } else { opt ??= {}; }
  const set = opt.mode === 3 ? (o, k, v) => { o[k] === undefined && (o[k] = v); }
    : opt.mode === 2 ? (o, k, v) => { k in o && (o[k] = v); }
    : opt.mode === 1 ? (o, k, v) => { o[k] = v; }
    : (o, k, v) => { v === undefined ? delete o[k] : (o[k] = v); };
  const isObj = (v) => !!v && [Object, undefined].includes(v.constructor);
  const travs = (o, k, v) => isObj(o[k]) && isObj(v);
  const x = {
    keys: new Set(opt.exclude?.filter((v) => v?.constructor === String) || []),
    refs: new WeakSet(opt.exclude?.filter((v) => isObj(v)) || []),
  };
  const had = (v, k) => { const h = x.refs.has(v) || x.keys.has(k); x.refs.add(v); return h; };
  const travel = (t, s) => s !== t && Object.entries(s)
    .forEach(([k, v]) => travs(t, k, v) && !had(v, k) ? travel(t[k], v) : set(t, k, v));
  tgt = Object.assign(tgt ?? {}); had(tgt); had(globalThis);
  srcs.forEach((src) => { src = Object.assign(src ?? {}); had(src); travel(tgt, src); });
  return tgt;
};

/**
Creates a serializable clone of an object, where cyclic redundancy is prevented
by replacing redundant values with path references to existing properties.
Scalable types are cast to scalar values.
@todo serializable
*/
export const serializable = (source) => {
  if (!isTra(source)) { return toSca(source); }
  const target = toEmp(source), path = ['@root'];
  const ex = new WeakMap([[source, path]]);
  const traverse = (s, t, p) => {
    Object.keys(s).forEach((k) => {
      const v = s[k];
      if (isTra(v)) {
        const kp = p.concat(k);
        if (!ex.has(v)) {
          ex.set(v, kp); t[k] = toEmp(v); traverse(v, t[k], kp);
        } else { t[k] = ex.get(v); }
      } else { t[k] = toSca(v); }
    });
  };
  traverse(source, target, path);
  return target;
};

/**
Creates a deserializable object generated with `serializable`.
The process is not strictly symetric to `serializable`, as `isSca` is used for values
that can be cast to scalars.
@todo deserializable
*/
export const deserializable = (source) => {
  if (!isTra(source)) { return toSca(source); }
  const target = toEmp(source);
  const isReference = (v) => v?.[0] === '@root';
  const getReference = (v) => { const a = v.slice(1); return a.reduce((acc, cur) => acc[cur], source); };
  const getValue = (v) => isReference(v) ? getReference(v) : v;
  const ex = new WeakSet([source]);
  const traverse = (s, t) => {
    Object.keys(s).forEach((k) => {
      const v = getValue(s[k]);
      if (isTra(v)) {
        if (!ex.has(v)) {
          ex.add(v);
          t[k] = toEmp(v);
          traverse(v, t[k]);
        } else {
          t[k] = v === s ? t : Object.assign(toEmp(v), v);
        }
      } else { t[k] = toSca(v); }
    });
  };
  traverse(source, target);
  return target;
};

/** Serializes an object into a JSON string. */
export const serialize = (obj) => JSON.stringify(serializable(obj));

/** Deserializes a JSON string into an object. */
export const deserialize = (str) => deserializable(JSON.parse(str));

/** Remove all own properties of an object. */
export const emptyObject = (obj) => Object.keys(obj).forEach((k) => delete obj[k]);

/** Assign readonly properties to a target object from a source object. */
export const assignReadonly = (t, s) => Object.entries(s).forEach(([k, v]) =>
  Object.defineProperty(t, k, { value: v, enumerable: true, writable: false })) ?? t;

/* Arrays and iterables: */

/* Flow and event functionality: */

/** Clear timeouts and/or intervals. */
export const clearTimeouts = (timeouts = true, intervals = true, ...except) => {
  let tid = 1 + (+setTimeout(() => {}));
  while (tid--) {
    const include = !except.includes(tid);
    timeouts && include && clearTimeout(tid);
    intervals && include && clearInterval(tid);
  }
};

/* Client string functionality: */

/** Appends content to an HTML string container and returns the result string. */
export const appendHTML = (content, parent, tag) => {
  let end = -1;
  if (tag) {
    end = parent.lastIndexOf('<!--/' + tag + '-->');
    if (end === -1) { end = parent.lastIndexOf('</' + tag + '>'); }
  }
  if (end === -1) { end = parent.lastIndexOf('</'); }
  if (end === -1) { end = parent.length; }
  return parent.slice(0, end) + content + parent.slice(end);
};

/**
Convert MD content into HTML.
Supports lists, code blocks and inline HTML with CSS styles and media resources.
*/
export const mdToHtml = (() => {
  let inCode = 0; const HD = 16, CH = '\\[!]#{()}*+-._',
  SE ='script|style|pre|code', SE0 = new RegExp(`<(${SE})[ >]`, 'i'), SE1 = new RegExp(`<\\/(${SE})>`, 'i'),
  RE1 = /^\s{0,3}(\#{1,6})\s+(.*?)\s*#*\s*$/, RE2 = /^\s*<[^>]+(?:>\s*<)?[^>]+>\s*$/,
  RE3 = /^(\s*)(?:[-*]|(\d+[.)])) (.+)$/, RE4 = /^\s{0,3}([-])(\s*\1){2,}\s*$/,
  RE5 = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/,
  start = (t) => t.replace(/\\([-(){}[\]#*+.!_\\])/g,
    (_a, b, _c, d) => String.fromCharCode(1, CH.indexOf(b) + d)
  ).replace(/(\*\*|__|~~)(\S(?:[\s\S]*?\S)?)\1/g,
    (_a, b, c) => '~~' === b ? '<del>' + c + '</del>' : '<b>' + c + '</b>'
  ).replace(/(^|\W)([_*])(\S(?:[\s\S]*?\S)?)\2(\W|$)/g,
    (_a, b, _c, d, e) => b + '<i>' + d + '</i>' + e
  ).replace(/(!?)\[([^\]<>]+)\]\((\+?)([^ )<>]+)(?: "([^()"]+)")?\)/g, (_a, b, c, d, e, f) => {
    let h = f ? ' title="' + f + '"' : '';
    return b ? '<img src="' + main.href(e) + '" alt="' + c + '"' + h + '/>' : (d && (h += ' target="_blank"'),
      '<a href="' + main.href(e) + '"' + h + '>' + c + '</a>');
  }),
  finish = (t) => t.replace(/\x01([\x0f-\x1c])/g, (_a, b) => CH[b.charCodeAt(0) - HD])
    .replace(/<p>\s*(?=<\/)(?!<\/p>)/gi, ''),
  split = (t) => t.replace(/\\\|/g, '\x00').replace(/^\s*\||\|\s*$/g, '').split('|')
    .map((a) => a.trim().replace(/\x00/g, '|')),
  table = (t) => {
    const h = split(t[0]), b = t.slice(2).map(split), c = (a, d) => `<${a}>` + finish(start(d)) + `</${a}>`;
    return '<table><thead><tr>' + h.map((a) => c('th', a)).join('') + '</tr></thead>'
      + '<tbody>' + b.map((a) => '<tr>' + a.map((d) => c('td', d)).join('') + '</tr>').join('')
      + '</tbody></table>';
  },
  task = (p, t) => {
    const m = /^\[( |x|X)\]\s+([\s\S]*)$/.exec(t);
    if (m && p.startsWith('>')) { p = ' style="list-style:none;padding-left:1rem;"' + p; }
    return m ? p + '<input type="checkbox" disabled style="cursor:default;"'
      + (m[1].trim() ? ' checked' : '') + '/> ' + m[2] : p + t;
  },
  main = (t) => (t || '').replace(/\r\n?/g, '\n').replace(/.+(?:\n.+)*/g, (a) => {
    const s0 = SE0.test(a), s1 = SE1.test(a); if (s1) inCode = 0; else if (s0) inCode = 1;
    const g = []; let d = null;
    if (inCode) {
      if (/^\s*```\s*$/.test(a)) return inCode = 0, '</code></pre>';
      d = /^([\s\S]*?)\n\s*```\s*$/.exec(a);
      return d ? (inCode = 0, d[1] + '</code></pre>') : a.replace(/<\/?p>/gi, '');
    } else {
      if (d = /^\s*```[^\n]*\n([\s\S]*?)\n\s*```\s*$/.exec(a)) return '<pre><code>' + d[1] + '</code></pre>';
      if (d = /^\s*```[^\n]*(?:\n([\s\S]*))?$/.exec(a)) return inCode = 1, '<pre><code>' + (d[1] ?? '');
    }
    if (!inCode && !s0) a = a.replace(/(`)([^`]*)\1/g, '<code>$2</code>');
    for (let f, h = start(a).split('\n'), i = 0; i < h.length; i++) {
      const k = h[i], u = RE2.test(k), p = u || inCode || (s0 && s1) ? '' : 'p'; let m = RE1.exec(k);
      if (!m) {
        if (/\|/.test(k) && RE5.test(h[i + 1] ?? '')) {
          const j = [k, h[++i]];
          while (/\|/.test(h[i + 1] ?? '')) j.push(h[++i]);
          g.push(f = [table(j), '', '']);
        } else (m = RE3.exec(k)) ? g.push(f = [m[3], m[2] ? 'ol' : 'ul', m[1].length])
          : RE4.test(k) ? g.push(f = ['', 'hr']) : f && 'hr' !== f[1] && 'h' !== f[1] ? f[0] += '\n' + k
          : g.push(f = [k, p, '']);
      } else { g.push(f = [m[2], 'h', m[1].length]); }
    }
    const o = []; let n = '';
    for (let i = 0; i < g.length; i++) {
      const f = g[i], q = f[0], r = f[1], s = f[2];
      if ('ul' === r || 'ol' === r) {
        while (o.length && s < o.at(-1)[1]) n += '</li></' + o.pop()[0] + '>';
        if (!o.length || s > o.at(-1)[1]) { o.push([r, s]); n += '<' + r + task('><li>', q);
        } else if (r !== o.at(-1)[0]) {
          n += '</li></' + o.pop()[0] + '>'; o.push([r, s]); n += '<' + r + task('><li>', q);
        } else n += '</li><li>' + task('', q);
      } else {
        while (o.length) n += '</li></' + o.pop()[0] + '>';
        if (q?.trim()) {
          if (r) n += 'hr' === r ? '<hr/>' : '<' + r + s + main.headAttrs(s, q) + '>' + q + '</' + r + s + '>';
          else n += q;
        }
      }
    }
    while (o.length) n += '</li></' + o.pop()[0] + '>';
    return finish(n);
  });
  return main.href = (a) => a, main.headAttrs = (_a, _b) => '', main;
})();

/* Flow and event functionality: */

/**
Fetches a URL resource with options and a callback function. Returns a stateful request container.
@param {string | URL | RequestInit | Record<string, unknown>} url
@param {RequestInit | Record<string, unknown> | Function} options
@return {Promise<Response>}
Usage examples:
`const result = await fetchRequest('data/url.json');`
`fetchRequest('data/url.json', (req) => console.log(req));`
`fetchRequest('data/url.json', { headers: {}, body: {}, callback: (req) => {}});`
`fetchRequest({ url: 'data/url.json', headers: {}, body: {}, callback: (req) => {}});`
*/
export const fetchRequest = (url, options = {}) => {
  if ([String, URL].includes(url?.constructor)) {
    options = typeof options === 'function' ? { callback: options } : Object.assign({}, options);
  } else { options = Object.assign({}, url); url = options.url ?? ''; delete options.url; }
  const contentType = 'content-type', jsonKey = 'application/json', text = 'text', resolvers = {
    [jsonKey]: 'json', 'multipart/': 'formData',
    'text/': text, 'application/javascript': text, 'application/xml': text, 'model/': text,
    'image/': 'blob', 'video/': 'blob', 'audio/': 'blob', 'font/': 'blob', 
    'application/': 'arrayBuffer',
  }, resolverKeys = Object.keys(resolvers);
  const callback = options.callback; delete options.callback;
  const timeout = Number(options.timeout) || 50e3; delete options.timeout;
  const abortController = new AbortController(); options.signal = abortController.signal;
  options.headers ??= {}; options.method ??= !options.body ? 'get' : 'post';
  options.cache ??= 'no-cache'; options.mode ??= undefined;
  if (options.body) {
    if (!options.headers.get || !options.headers.set) {
      Object.defineProperty(options.headers, 'get', { enumerable: false });
      options.headers.get = (k) => options.headers[k];
      Object.defineProperty(options.headers, 'set', { enumerable: false });
      options.headers.set = (k, v) => { options.headers[k] = v; };
    }
    !options.headers.get(contentType) && options.headers.set(contentType, jsonKey);
    if (options.headers.get(contentType) === jsonKey) {
      if (options.body.forEach) { // FormData
        const body = {};
        options.body.forEach((v, k) => {
          if (k in body) { if (!body[k]?.push) body[k] = [body[k]]; body[k].push(v); } else { body[k] = v; }
        });
        options.body = body;
      } else if ([Object, undefined].includes(options.body.constructor)) {
        options.body = JSON.stringify(options.body);
      }
    }
  }
  const getHeadersObj = (h = {}) => h.entries ? Object.fromEntries(h.entries()) : h;
  const getHeaderKeys = (h = {}) => h.entries ? Array.from(h.keys()) : Object.keys(h);
  const request = {
    url, method: options.method, time: Date.now(), duration: NaN, aborted: 0,
    requestHeaderKeys: getHeaderKeys(options.headers), hasRequestBody: !!options.body,
    error: null, result: null, responseHeaders: {}, response: null,
    abort: (code = NaN) => { abortController.abort(); request.aborted ||= code || 1; },
  };
  const tId = setTimeout(() => request.abort(-1), timeout);
  const resolver = (response, type) => {
    const method = resolvers[resolverKeys.find((k) => type?.includes(k))] || text;
    return response?.[method]();
  };
  const processor = () => {
    clearTimeout(tId); request.duration = Date.now() - request.time; callback?.(request);
  };
  return fetch(url, options)
    .then((response) => {
      request.response = response; request.responseHeaders = getHeadersObj(response.headers);
      if (!response.ok) { throw new Error(`[${response.status}] ${response.statusText}`); }
      return resolver(response, request.responseHeaders[contentType]);
    })
    .then((result) => (request.result = result))
    .catch((error) => (request.error = error))
    .finally(processor);
};

/* * */
