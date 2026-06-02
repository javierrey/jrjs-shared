/*
core.js
Basic core functionality for all environments.
Dependencies: none
update: 2024
author: javier.rey.eu@gmail.com
*/
// _@ts-check // @ts-ignore TS7006, TS2339

/* Types functionality: */

/**
@typedef {Record<string, any>} PlainObject;
@typedef {Record<number | string, any>} ArrayObject;
@typedef {{ (...args: any[]): any, [key: string]: any }} FunctionObject;
*/

/** AsyncFunction constructor (no globalThis.AsyncFunction defined). */
export const AsyncFunction = (async () => {}).constructor;

/** Quick type checks and casts. Copy inside pure independent functions. */

export const isNul = (v) => [undefined, null, NaN].includes(v);
export const isObj = (v) => !!v && [Object, undefined].includes(v.constructor);
export const isArr = (v) => !!v?.[Symbol.iterator] && v.constructor !== String;
export const isPri = (v) => !v || !(v instanceof Object || !v.constructor);
export const isFun = (v) => typeof v === 'function';
export const isNum = (v) => parseFloat(v) === Number(v);
export const isInt = (v) => Math.floor(parseFloat(v)) === Number(v);
export const isStr = (v) => v?.constructor === String;
export const isSca = (v) => !v || [Boolean, Number, String, BigInt].includes(v.constructor);
export const isXml = (v) => /^\s*</.test(v) && />\s*$/.test(v);
export const isJso = (v) => /^\s*\[?\s*\{/.test(v) && /\}\s*\]?\s*$/.test(v);
export const isBuf = (v) => typeof v?.slice === 'function' && 'byteLength' in v;
export const isEmp = (v) => {
  if (v == null || Object.is(v, NaN)) return true; if (v[Symbol.iterator]) return !(v.size ?? v.length);
  for (const p in v) return false; return true;
};
export const isKey = (v) =>
  (Number.isInteger(v) && v > -1) || (typeof v === 'string' && v.length < 1025 && !/\s/.test(v));

export const toNum = (v) =>
  [Number, Boolean, Date].includes(v?.constructor) ? +v : parseFloat(v) === (v = Number(v)) ? v : NaN;
export const toSam = (v) => {
  if (!v?.slice) { v = String(v ?? ''); }
  const R = 1e3, c = ~~((v.byteLength ?? v.length ?? 0) / 2), b = Math.max(0, c - R), s = v.slice(b, b + 2 * R);
  return 'byteLength' in s ? new TextDecoder().decode(s) : s;
};

export const isTra = (v) => isObj(v) || v?.every?.(isObj); // isObj(v?.[0]) // && isObj(v.at(-1))
export const isBin = (v) => toSam(v).includes('\x00');

export const toSca = (v) => {
  if (isObj(v) || Array.isArray(v)) try { return JSON.stringify(v); } catch {}
  return !v ? v : [Boolean, Number, Date, String].includes(v.constructor) ? v.valueOf()
    : isBuf(v) ? new TextDecoder().decode(v) : v[Symbol.iterator] ? `[${v}]` : String(v);
};
export const toStr = (v) => isStr(v = toSca(v)) ? v : String(v ?? '');
export const toEmp = (v) => isArr(v) ? [] : {};

/** Returns a real number from a numeric value, limiting infinity to the max number. */
export const toRealNumber = (v) => {
  const number = toNum(v);
  return isNaN(number) || (number > -Number.MIN_VALUE && number < Number.MIN_VALUE) ? 0
    : number > Number.MAX_VALUE ? Number.MAX_VALUE : number < -Number.MAX_VALUE ? -Number.MAX_VALUE : number;
};

/** Creates a buffer from a string. */
export const stringToBuffer = (string) => new TextEncoder().encode(string).buffer;

/** Creates a string from a buffer. Optional param `enc` defaults to 'utf-8' and `bom` to false. */
export const bufferToString = (buffer, enc, bom) => new TextDecoder(enc, { ignoreBOM: !!bom }).decode(buffer);

/* Log functionality: */

/**
Returns log function wrapping up `console` and enabling `error`, `warn`, `info` and `debug` methods.
Usage: `const log = Log({ name: 'my-log', level: 3, trace: 0, pretty: 0, limit: 1e4, redact: ['pass', 'auth'] });`
`log.warn('A warning'); // [WARN 25-12-08 Mo 19:18:24.362] "my-log" @at <anonymous>:1:1 \n 'A warning'`
The created `log` object is also a function, and it can be used in development regardless of the log level.
constructor method:
  ...args: any list of arguments.
  The log header contains the log method, time, log name, and the log call location in the code.
public static members:
  typename: 'Log', type identifier.
  error, warn, info, debug: log level methods.
  config: Configuration object (mutable properties):
    name: log's header name.
    level: 0 disabled, 1 error, 2 warn, 3 info, 4 debug.
    trace: 0 disabled, 1 debug and error, 2 warn, 3 all. Append the stack trace to the output.
    pretty: indent stringified objects output if value is truthy, otherwise skips stringification.
    limit: 0, 1e3, 1e4, ... limit string output sizes, removing the middle part.
    redact: array of key prefixes to redact values in objects, by default: ['pass', 'auth'].
*/
export const Log = (config = {}) => {
  const typename = 'Log', CONSOLE = console;
  config = typeof config === 'string' ? { name: config } : typeof config === 'number' ? { level: config } : config;
  config = Object.seal({ name: '', level: 3, trace: 0, pretty: 0, limit: 1e4, redact: ['pass', 'auth'], ...config });
  const METHODS = ['log', 'error', 'warn', 'info', 'debug'], DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const isStr = (v) => v?.constructor === String;
  const isObj = (v) => !!v && [Object, undefined].includes(v.constructor);
  const isTra = (v) => (isObj(v) || v?.every?.(isObj)) && v !== globalThis;
  const redact = (o, k) => config.redact.some((r) => new RegExp(`(^|[-_.])${r}`, 'i').test(k)) && (o[k] = '*');
  const trav = (o) => Object.entries(o).forEach(([k, v]) => isTra(v) ? trav(v) : isStr(v) && redact(o, k));
  const print = (t) => {
    if (isTra(t)) {
      trav(t); if (config.pretty) try { t = JSON.stringify(t, null, 2).replace(/(?:\\[\\ntfv])+/g, ' '); } catch {}
    }
    if (config.limit && isStr(t?.[0])) {
      if (!isStr(t)) { t = `[${t}]`; }
      if (t.length > config.limit) { const l = ~~(config.limit / 2); t = t.slice(0, l) + '...' + t.slice(-l); }
    }
    CONSOLE.log(t);
  };
  const trace = (level) => {
    const stack = (new Error().stack ?? '').trim().split('\n'); stack[0].startsWith('Error') && stack.shift();
    return stack.slice(level ? 3 : 2);
  };
  const getProcessConfig = () => globalThis.globalConfig?.processConfig ?? globalThis.globalConfig ?? globalThis;
  const renderUTC = (d = new Date()) => d.toISOString().replace('T', ` ${DAYS[d.getUTCDay()]} `).slice(0, -1);
  const method = (level) => (...args) => { config.level >= level && log(METHODS[level], ...args); };
  const log = (...args) => { // main method
    const method = METHODS.includes(args[0]) ? args.shift() : METHODS[0], level = METHODS.indexOf(method);
    if (!config.level && level) return;
    const tron = config.trace && (config.trace >= level || level > 3);
    const stack = trace(level), at = (stack[0] ?? '').trim().replace(/\(|.*\/|\)/g, '');
    const wid = getProcessConfig().workerId, worker = isNaN(wid) ? '' : ` W${wid}`;
    const name = config.name ? ` "${config.name}"` : '';
    CONSOLE[method](`\n[${method.toUpperCase()} ${renderUTC()}]${worker}${name} @${at}`); args.forEach(print);
    tron && stack.length > 1 && CONSOLE.log('TRACE:\n' + stack.slice(1).join('\n'));
  };
  const members = { // public members
    typename, config, error: method(1), warn: method(2), info: method(3), debug: method(4),
  };
  return Object.freeze(Object.assign(log, members));
};

export const log = Log(3);

/* String and RegExp transformations: */

/**
Regular expression functionality.
```
const rex = REX('abBbc'), regexp = /bb/i;
[rex.indexOf(regexp), rex.lastIndexOf(regexp)]; // [1, 2]
```
*/
export const REX = (() => {
  const typename = 'REX';

  /**
  Escapes a string to be used literally as a RegExp source parameter.
  `new RegExp(REX.escapeSource('[a-z]'), 'g').test('[a-z]') // true`
  Note: Also available static `RegExp.escape('[a-z]')`.
  */
  const escapeSource = (source) => source.replace(/[-^$*+?|.,:=!<(){}/[\]\\]/g, '\\$&');

  /** Transforms special characters into their escaped literals: `\\b\\f\\n\\r\\t\\v` */
  const escapeSpecial = (() => {
    const specials = '\b\f\n\r\t\v', replacer = ['\\b', '\\f', '\\n', '\\r', '\\t', '\\v'];
    const re = new RegExp(`[${specials}]`, 'g'), fn = (m) => replacer[specials.indexOf(m)];
    return (source) => source.replace(re, fn);
  })();

  /**
  Clones an existing RegExp with new flags.
  If flags is prefixed with a plus sign, `+`, it extends the source flags.
  If flags is prefixed with a minus sign, `-`, it removes the specified source flags.
  Otherwise flags replaces the source flags. If empty (default), it removes all flags.
  */
  const clone = (re, flags = '') => {
    if (flags[0] === '-') { flags = [...re.flags].filter((f) => !flags.includes(f)).join(''); }
    else if (flags[0] === '+') { flags = [...new Set(re.flags + flags.slice(1))].join(''); }
    return new RegExp(re.source, flags);
  };

  /** Returns the start and end indices of a trimmed substring, or `[-1, 0]` if the string is blank. */
  const trims = (text) => [/\S/.exec(text)?.index ?? -1, /\s*$/.exec(text)?.index ?? -1];

  /** Finds an array of RegExp matches in a text, giving their indices and lengths. */
  const matches = (text, re, overlap) => {
    const matched = []; let match;
    if (!re.flags.includes('g')) re = new RegExp(re.source, 'g' + re.flags);
    while ((match = re.exec(text)) && match.index !== matched.at(-1)?.index) {
      matched.push({ index: match.index, length: match[0].length }); // omit matched value
      if (overlap) { re.lastIndex = match.index + 1; }
    }
    return matched;
  };

  /** Finds the string index of a regular expression match. */
  const indexOf = (text, re) => {
    if (re.flags.includes('g')) { re = new RegExp(re.source, re.flags.replace(/g/, '')); }
    return re.exec(text)?.index ?? -1;
  };

  /** Finds the string last index of a regular expression match. */
  const lastIndexOf = (text, re) => {
    let index, lastIndex = -1;
    if (!re.flags.includes('g')) re = new RegExp(re.source, 'g' + re.flags);
    while ((index = re.exec(text)?.index ?? -1) > -1) {
      lastIndex = index; re.lastIndex = index + 1;
    }
    return lastIndex;
  };

  /**
  Matches an unescaped character or string, preceeded by an even number of backslashes, including 0.
  `REX('"\\"\\\\"\\\\\\"').unescapedMatches('"') // [0, 5]`
  `REX('"\\"\\\\"\\\\\\"').unescapedMatches('\\"') // [1, 8]`
  `REX('\n\\\n\\\\\n\\\\\\\n').unescapedMatches('\n') // [0, 5]`
  `REX('\n\\n\\\\n\\\\\\n\\\\\\\\n').unescapedMatches('\\n') // [1, 8]`
  */
  const unescapedMatches = (text, char, flags = '') => {
    const B = '\\\\', BB = `(${B + B})*`, echar = escapeSource(char);
    if (!flags.includes('g')) flags = 'g' + flags;
    const re = new RegExp(`(?<=^${BB}|[^${B}]${BB})${echar}`, flags);
    return matches(text, re).map((v) => v.index);
  };

  /**
  Recurrent replace of one or more regular expressions and their replacers.
  Passing regular expressions with the `g` flag may speed up the search. Avoid infinite loops.
  `REX('--+-++---+').replaceWhile([/(\+\-|\-\+)/g, '-'], [/(\+\+|\-\-)/g, '+']); // '+'`
  */
  const replaceWhile = (text, ...rexReps) => {
    while (rexReps.some(([rex, rep]) => rex.test(text = text.replace(rex, rep)))) {}
    return text;
  };

  /** constructor method */
  const main = (text) => Object.freeze({
    input: text, // @hide/show input arguments
    trims: () => trims(text),
    matches: (re, overlap) => matches(text, re, overlap),
    indexOf: (re) => indexOf(text, re),
    lastIndexOf: (re) => lastIndexOf(text, re),
    unescapedMatches: (char, flags) => unescapedMatches(text, char, flags),
    replaceWhile: (...rexReps) => replaceWhile(text, ...rexReps),
  });

  /** public static members */
  const members = {
    typename, escapeSource, escapeSpecial, clone,
    // Also implemented in instance version:
    trims, matches, indexOf, lastIndexOf, unescapedMatches, replaceWhile,
  };

  return Object.freeze(Object.assign(main, members));
})();

/** Capitalizes or lower-cases the first character of a text. */
export const firstToCase = (text, capital = true) => {
  const first = capital ? text[0].toUpperCase() : text[0].toLowerCase();
  return first + text.slice(1);
};

/**
Transforms a text into a camel-case word.
```
toCamelCase('json-response-data-url'); // 'jsonResponseDataUrl'
toCamelCase('JSON_RESPONSE_DATA_URL', true); // 'JsonResponseDataUrl'
toCamelCase('JSON response data url'); // 'jsonResponseDataUrl'
```
*/
export const toCamelCase = (text, capital = false) => {
  text = text.trim().toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/, '')
    .replace(/-[a-zA-Z0-9]/g, (match) => match.slice(1).toUpperCase());
  if (!capital) { text = text[0].toLowerCase() + text.slice(1); }
  return text;
};

/**
Transforms a camel-case word into a kebab-case or other custom-jointed string.
```
fromCamelCase('JSONResponseDataURL'); // 'json-response-data-url'
fromCamelCase('JSONResponseDataURL', '_').toUpperCase(); // 'JSON_RESPONSE_DATA_URL'
fromCamelCase('JSONResponseDataURL', ' ', true); // 'Json response data url'
```
*/
export const fromCamelCase = (text, joint = '-', capital = false) => {
  const jointReplacer = `$1${joint}$2`;
  const jointRE = joint.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  text = text
    .replace(/([a-z])([A-Z])/g, jointReplacer)
    .replace(/([A-Z])([A-Z][a-z])/g, jointReplacer)
    .replace(new RegExp(`[\\s${joint}]+`, 'g'), joint)
    .replace(new RegExp(`^${joint}+`), '').replace(new RegExp(`${jointRE}+$`), '')
    .toLowerCase().trim();
  if (capital) { text = text[0].toUpperCase() + text.slice(1); }
  return text;
};

/** Escapes sensitive characters into numeric HTML encoded entities to avoid inline javascript injection. */
export const sanitize = (text) => text?.replace(/[<>"'`\\=(]/g, (m) => `&#${m.charCodeAt(0)};`);

/** Unescapes numeric HTML encoded entities into characters. */
export const unsanitize = (text) => text?.replace(/&#\d+;/g, (m) => String.fromCharCode(+m.slice(2, -1)));

/* Object transformations and String parsers: */

/**
Parses a code expression by generating and invoking a function.
@param {string} exp - The expression to parse.
@param {Object} ctx - Optional context object with references.
Usage: `parse('{ json5prop: 1 }')`, `parse('x + 1', { x: 2 })`.
Warning: Avoid unintended injections on any use of `Function`.
*/
export const parse = (exp, ctx = {}) => {
  try { return Function(`{${Object.keys(ctx)}}`, `return(${exp})`)(ctx); } catch { return undefined; }
};

/** Checks if two objects are equal recursively. */
export const equal = (o1, o2) => {
  if (o1 === o2 || Object.is(o1, o2)) { return true; }
  if (typeof o1 !== 'object' || o1 === null || typeof o2 !== 'object' || o2 === null) { return false; }
  const k1 = Object.keys(o1), k2 = Object.keys(o2);
  if (k1.length !== k2.length) { return false; }
  for (const k of k1) {
    if (o1[k] !== o2[k] && o1[k] !== o1) {
      if (!k2.includes(k) || !equal(o1[k], o2[k])) { return false; }
    }
  }
  return true;
};

/**
Creates a deep partial of an object based on a filter schema.
Only properties from the object present in the filter with value true (truthy) are included
in the partial, missing or falsy properties in the filter are excluded.
Both object and filter parameters should be plain objects.
`partial({ a: 2, b: { c: 2, d: 2 } }, { b: { c: 0, d: 1 } }); // { b: { d: 2 } }`
*/
export const partial = (obj, flt) => {
  const part = {}, isObj = (v) => !!v && [Object, undefined].includes(v.constructor);
  const travel = (p, o, m) => Object.entries(o).forEach(([k, v]) => {
    isObj(m[k]) && isObj(v) ? (p[k] = {}) && travel(p[k], v, m[k]) : m[k] && (p[k] = v);
  });
  isObj(flt) && isObj(obj) ? travel(part, obj, flt) : flt && Object.assign(part, obj);
  return part;
};

/** Clones a plain object or array recursively. Non-plain object properties are assigned by reference. */
export const clone = (obj) => {
  const isObj = (v) => !!v && [Object, undefined].includes(v.constructor);
  const isTra = (v) => (isObj(v) || v?.every?.(isObj)) && v !== globalThis;
  const map = (v) => typeof v?.slice === 'function' && !v.substring ? v.slice() : v;
  if (!isTra(obj)) { return map(obj); }
  const emp = (v) => typeof v?.join === 'function' ? [] : {};
  const travel = (t, s) => Object.entries(s).forEach(([k, v]) => {
    if (v === obj) { t[k] = tgt; } else if (v === s) { t[k] = t; }
    else if (isTra(v)) { t[k] = emp(v); travel(t[k], v); }
    else { t[k] = map(v); }
  });
  const tgt = emp(obj); travel(tgt, obj);
  return tgt;
};

/** Remaps a plain object or array recursively calling a mapping function on each non-traversable property. */
export const remap = (obj, map) => {
  const isObj = (v) => !!v && [Object, undefined].includes(v.constructor);
  const isTra = (v) => (isObj(v) || v?.every?.(isObj)) && v !== globalThis;
  const travel = (o) => Object.entries(o).forEach(([k, v]) => isTra(v) ? travel(v) : map(o, k, obj));
  map instanceof Function && isTra(obj) && travel(obj);
  return obj;
};

/** Updates the content of a target object with properties from one or more source objects recursively. */
export const merge = (tgt, ...srcs) => {
  const set = (o, k, v) => { v === undefined ? delete o[k] : (o[k] = v); };
  const isObj = (v) => !!v && [Object, undefined].includes(v.constructor);
  const travs = (o, k, v) => isObj(o[k]) && isObj(v) && v !== globalThis;
  const travel = (t, s) => s !== t && Object.entries(s)
    .forEach(([k, v]) => travs(t, k, v) ? travel(t[k], v) : set(t, k, v));
  tgt = Object.assign(tgt ?? {});
  srcs.forEach((src) => { src = Object.assign(src ?? {}); travel(tgt, src); });
  return tgt;
};

/**
Populates an object with default values from other objects, when they are absent
or less curated than the source defaults: undefined, null, NaN, '', [] and {}.
Nested objects are extended recursively with the corresponding default values.
*/
export const hydrate = (tgt, ...srcs) => {
  const set = (o, k, v) => v !== undefined && v !== o[k] && (
    v === null ? o[k] === undefined : (
      o[k] == null || Object.is(o[k], NaN) || (!Object.is(v, NaN) && (
        o[k] === '' || (typeof o[k] === 'object' && typeof v === 'object' &&
          !Object.keys(o[k]).length && Object.keys(v).length))))
  ) && (o[k] = v);
  const isObj = (v) => !!v && [Object, undefined].includes(v.constructor);
  const travel = (t, s) => s !== t && Object.entries(s)
    .forEach(([k, v]) => isObj(t[k]) && isObj(v) ? travel(t[k], v) : set(t, k, v));
  tgt = Object.assign(tgt ?? {});
  srcs.forEach((src) => { src = Object.assign(src ?? {}); travel(tgt, src); });
  return tgt;
};

/**
Gets a property value in an unknown type object if present, or undefined otherwise.
Accepts a list of nested keys: `getProperty(object, 'items', '0', 'title', 'en-US')`
In its Typescript version, `getProperty` can be combined with `hasKey`, to quickly
reach and assert the presence of a property in an `unknown` type, avoiding `any`:
```typescript
export const getProperty = (object: unknown, ...keys: PropertyKey[]) => keys.reduce(
  (acc, key) => acc && typeof acc === 'object' && key in acc ? (acc as { [key in PropertyKey]: unknown })[key] : undefined,
  object,
);
export const hasKey = (object: unknown, key: PropertyKey): object is { [key]: unknown } =>
  !!object && typeof object === 'object' && key in object;
```
*/
export const getProperty = (object, ...keys) =>
  keys.reduce((acc, key) => acc && typeof acc === 'object' && key in acc ? acc[key] : undefined, object);

/**
Compares two type objects by matching one or more nested properties.
`matchObjects(objA, objB, ['fields', 'name', 'en-US'], ['contentType', 'sys', 'id'])`
*/
export const matchObjects = (a, b, ...fields) =>
  a === b || fields.length && fields.every((field) => getProperty(a, ...field) === getProperty(b, ...field));

/**
Finds the index of an object in an array by matching one or more nested properties.
`objectIndex(objArray, obj, ['fields', 'name', 'en-US'], ['contentType', 'sys', 'id'])`
*/
export const objectIndex = (array, object, ...fields) =>
  array.findIndex((item) => matchObjects(item, object, ...fields));

/**
Removes duplicates from an array of objects by matching one or more nested properties.
`removeObjectDuplicates(objArray, ['fields', 'name', 'en-US'], ['contentType', 'sys', 'id'])`
*/
export const removeObjectDuplicates = (array, ...fields) => {
  for (let i = array.length - 1; i > 0; i--) {
    objectIndex(array, array[i], ...fields) < i && array.splice(i, 1);
  }
};

/**
Sorts an array of objects by matching one or more nested properties.
`sortObjects(objArray, ['contentType', 'sys', 'id'], ['fields', 'name', 'en-US'])`
*/
export const sortObjects = (array, ...fields) => {
  !fields.length && fields.push([]);
  array.sort((a, b) => {
    for (const field of fields) {
      const aValue = String(getProperty(a, ...field) ?? a).toLowerCase();
      const bValue = String(getProperty(b, ...field) ?? b).toLowerCase();
      if (aValue !== bValue) {
        return aValue < bValue ? -1 : 1;
      }
    }
    return 0;
  });
};

/**
Parses a key name or key path in a context object, and returns its value, or undefined if not found.
If the `ctx` context object parameter is omitted or null, `globalThis` is used by default.
If the `dot` separator parameter is omitted or null, character `.` is used by default.
If the `key` is a string and parameter `dot` is not empty, the `key` will be interpreted
as a dot separated nested path, e.g. `items[0].title['en-US']` (or `items.0.title.en-US`).
If `dot` is the empty string, the key is interpreted as a direct property and not as a path.
If the `key` is a string array, the `dot` separator is not used.
The dot separator can be any string, but it must not contain characters expected in key
names (e.g. a dash `-`), and it should not contain any quotes or square brackets, `\`'"[]`.
Common valid separators: `.`, `:`, `/`, `\\`, `|`, `&`, `>`, `,`, ...
*/
export const parseKey = (key, ctx, dot) => {
  ctx ??= globalThis; dot ??= '.';
  if (typeof key === 'string') {
    if (!dot || !key.includes(dot)) { return ctx[key]; }
    key = key.replace(/\[/g, dot).replace(/["'`\]]/g, '').split(dot); // .map((k) => k.trim()); // trim?
  }
  let value = !key[0] ? undefined : ctx; while (value != null && key[0]) { value = value[key.shift()]; }
  return key.length ? undefined : value;
};

/**
Parses a string value or returns the given value if it is not a parseable string.
Valid numeric strings return numbers.
Other strings, including objects `{...}` and arrays, `[...]`, try `JSON.parse`.
If `JSON.parse` fails, `parseKey` is called, along with `ctx` and `dot` parameters.
*/
export const parseValue = (value, ctx, dot) => {
  if (typeof value === 'string') {
    if ((!isNaN(Number(value)) && value.trim()) || value === 'NaN') { return Number(value); }
    if (isJso(value)) try { return JSON.parse(value); } catch {}
    if (isKey(value)) { return parseKey(value, ctx, dot) ?? value; }
  }
  return value;
};

/**
Parses a URL-encoded query from a string into a query object, e.g. `a=1&b=2` or `//urlpath?a=1&b=2`,
or from an array of strings with encoded key-value pairs, e.g. `['a=1', 'b=2']`.
If it is not a string or string array, it returns a copy of the query.
If a query value is enclosed in `${...}`, the value will be interpreted using `parseValue`,
together with `options` context `ctx` and key separator `dot`.
*/
export const parseQuery = (query, options) => {
  const object = {}; let aux; query ??= {}; options ??= {};
  if (query.constructor === String) {
    aux = query.indexOf('#'); if (aux !== -1) { query = query.slice(0, aux); }
    query = query.slice(query.indexOf('?') + 1).trim();
    query = !query ? [] : query.split('&');
  } else if (!query.forEach) { return Object.assign(object, query); }
  query.forEach((item, ind) => {
    item = String(item ?? ''); aux = item.indexOf('=');
    const key = decodeURIComponent(item.substring(0, aux)).trim() || String(ind);
    const value = decodeURIComponent(item.slice(aux + 1)).trim();
    const parse = value[0] + value[1] + value.at(-1) === '${}';
    object[key] = parse ? parseValue(value.slice(2, -1), options.ctx, options.dot) : value;
  });
  return object;
};

/* Arrays and iterables: */

/**
Alphanumeric compare for string array sorting. Example:
`['a10', 'a2', 'a', 'A10', 'A2', 'A'].sort(alphanumericCompare); // ['A', 'a', 'A2', 'a2', 'A10', 'a10']`
*/
export const { compare: alphanumericCompare } = Intl.Collator('en', { numeric: true, caseFirst: 'upper' });

/** Indices of all occurrences in an array-like iterable, matching a value, expression or function. */
export const arrayIndicesOf = (array, match, from, to, not) => {
  from = !from ? 0 : from < 0 ? Math.max(from, -array.length) + array.length : from;
  if (from || to) { array = array.slice(from, to); }
  const matcher = match instanceof Function ? match
    : match?.constructor === RegExp ? (v) => match.test(v)
    : (v) => v === match || Object.is(v, match);
  const tester = !not ? matcher : (v) => !matcher(v);
  return array.reduce((acc, val, ind) => {
    tester(val) && acc.push(from + ind);
    return acc;
  }, []);
};

/* URL and system path functionality: */

/** Rebases a URL from the current location base, or optionally from a custom base. */
export const rebaseUrl = (url, base = null) =>
  new URL(url ?? '', new URL(base ?? '', globalThis.location ?? 'file:///')).href;

/** Rebases all quoted URLs in a code text, optionally from a custom base. */
export const rebaseUrls = (code, base = null) => code.replace(
  /(?<=["'`(])(?:[a-z]+[:\/]|\.{1,2}\/?|\/{1,2})[^ "'`)]*(?=["'`)])/gi,
  (m) => rebaseUrl(m, base),
);

/** Rebases all links in an HTML, optionally from a custom base. */
export const rebaseLinks = (html, base = null) => html.replace(
  /(?<=(?:[\s:-](?:href|src|url)\s*[=(]\s*["']))[^"']*(?=["'])/gi,
  (m) => rebaseUrl(m, base),
);

/**
Splits a URL or file path into components `{ root, path, slug, query, anchor, open }`.
Values are normalized with forward slash separators.
The last part of the path becomes the slug if it is a dotted name, otherwise the slug is a slash `/`.
Property `open` is true when the given URL path does not end with a slash `/`.
*/
export const urlComponents = (url) => {
  let index, root = '', query = '', anchor = ''; url = String(url ?? '');
  index = url.indexOf('#'); if (index > -1) { anchor = url.slice(index); url = url.slice(0, index); }
  index = url.indexOf('?'); if (index > -1) { query = url.slice(index); url = url.slice(0, index); }
  url = url.replace(/\\/g, '/');
  index = (url.indexOf('/', (url.indexOf('://') + 1 || -2) + 2) + 1 || url.length + 1) - 1;
  root = url.slice(0, index); url = url.slice(index);
  index = url.indexOf(':/') + 1; if (index) { root += url.slice(0, index); url = url.slice(index); }
  let open = +(url.at(-1) !== '/'), slug = url.slice(url.lastIndexOf('/')), path = url.slice(0, -slug.length);
  if (!slug.includes('.')) { path += slug; slug = '/'; path = path.replace(/\/+$/, ''); } else { open = 0; }
  return { root, path, slug, query, anchor, open };
};

/** Resolves a folder path from multiple absolute and relative paths combined. */
export const resolvePath = (...paths) => {
  const normalizePath = (path) => {
    const res = [], abs = path[0] === '/', folders = path.split('/');
    for (let i = 0; i < folders.length; i++) {
      const pth = folders[i]; if (!pth || pth === '.') { continue; }
      if (pth === '..') {
        if (res.length && res.at(-1) !== '..') { res.pop(); }
        else if (!abs) { res.push('..'); }
      } else { res.push(pth); }
    }
    return res.join('/');
  };
  let resolvedPath = '', resolvedAbsolute = false;
  for (let i = paths.length - 1; i > -1 && !resolvedAbsolute; i--) {
    const path = paths[i]; if (!path) { continue; }
    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path[0] === '/';
  }
  resolvedPath = normalizePath(resolvedPath);
  return (resolvedAbsolute ? '/' : '') + resolvedPath || '.';
};

/**
Extracts a relative path from a URL string, to match equivalent URLs resolved in different ways.
The returned path is normalized with forward slash separators.
e.g. The following URLs give the same normalized URI core, 'dir/dir/file.ext':
`urlCore('http://localhost/dir/dir/file.ext?p1=v1#a1')`
`urlCore('../../dir/dir/file.ext?p2=v2#a2')`
`urlCore('https://127.0.0.1:80/dir/dir/file.ext/?p3=v3#a3')`
Usages:
Equality test: `urlCore(firstUrl) === urlCore(secondUrl)`
Relative sub-path inclusion: `('/' + urlCore(absoluteUrl) + '/').includes('/' + urlCore(relativeUrl) + '/')`
In a browser document, selector inclusion: `document.querySelector('[href*="' + urlCore(url) + '"]')`
Warning: Use with care, different relative endpoints may contain a coincident core.
*/
export const urlCore = (url) => {
  let i; url = url == null ? '' : ('' + url).slice(0, 1e3);
  i = url.indexOf('#'); if (i > -1) { url = url.slice(0, i); }
  i = url.indexOf('?'); if (i > -1) { url = url.slice(0, i); }
  url = url.replace(/\\/g, '/').replace(/^([a-z\d]*:)?\/{2,}[^/]+\/?/i, '')
    .replace(/^(\.*\/+)+/, '').replace(/\/+$/, '');
  return url;
};

/* Flow and event functionality: */

/**
Builds an environment descriptor for both browser and nodejs contexts.
Typically called once at the begining of a main thread process, worker or frame.
*/
export const getEnvironment = () => {
  const env = {}, glob = globalThis;
  env.isBrowser = !glob.process?.argv; // not nodejs
  env.isWindow = typeof Window !== 'undefined' && glob.window === glob; // not worker
  let aux; aux = glob.parent?.frames?.[0]; env.isFrame = !!aux && Object(aux) !== glob; // not top
  if (env.isBrowser) {
    aux = location.pathname; env.root = location.origin;
    env.params = location.search.slice(1); env.params = !env.params ? [] : env.params.split('&');
    if (aux.lastIndexOf('.') <= aux.lastIndexOf('/')) { aux += '/'; }
  } else {
    aux = process.env.PWD ?? ''; env.root = aux.substring(0, aux.indexOf('/'));
    aux = aux.slice(env.root.length); env.params = glob.process.argv.slice(2);
  }
  env.slug = aux.substring(aux.lastIndexOf('/')); env.path = aux.slice(0, -env.slug.length);
  env.slug ||= '/'; env.path = env.path.replace(/\/$/, '');
  return env;
};

/** Dynamically import a module returning its default export or a JSON file if type is 'json'. */
export const importFile = async (url, type) => (await (type ? import(url, { with: { type } }) : import(url))).default;

/**
Delays execution for the given milliseconds, passing optional arguments to the promise resolver.
`delay(2e3, ['a1', 'a2']).then((a) => console.log(a));`
`(async () => console.log(await delay(1e3, ['a1', 'a2'])))();`
*/
export const delay = (ms, args) => new Promise((rs) => setTimeout(() => rs(args), ms));

/**
Holds a promise resolution until a stateful condition is ready.
@param {{ (): boolean; timeout: number; gap: number; ease: number } | Record<string, unknown>} ready:
A stateful object or function to test the ready condition.
@param {unknown[]} args: Optional arguments array passed to the resolve method.
@return: A promise that resolves when the ready condition is met, or rejects on error or timeout.
An async-await call to `when` returns the resolved or rejected output.
If parameter `ready` is a function, its return value as boolean determines the ready state.
If `ready` is a stateful object, the state is determined by its property `pending`, being false,
or property `done`, being true, or property `progress`, being 1 (not lower than 1).
Some optional control properties can be attached to the `ready` function or object:
Property `timeout`, 50e3 ms by default, will reject the promise if it has not been resolved before.
If `timeout` is defined as zero or less, the promise resolves or rejects immediately.
Property `gap`, 50 ms by default, determines the tests rate.
Property `ease`, 10% of `timeout` by default, defines a maximum gap, so the tests rate will be
progressively eased out, starting at the initial interval.
If `ease` is defined as zero or lower than the initial `gap`, the rate remains constant.
Usage example (using a stateful object):
```
const ready = { pending: 0, timeout: 2e3, gap: 50, ease: 200, result: [], throw: false };
const stayBusy = (ms) => ++ready.pending && setTimeout(() => ready.pending--, ms);
(async () => {
  stayBusy(1e3); // logs [1, 2, 3] or [1, 2, <Error>] if ready.throw is true
  console.log('await when:', await when(ready, [1])
    .then((ar) => { stayBusy(1e3); ready.result = ar.concat(2); return when(ready, ready.result); })
    .then((ar) => { if (ready.throw) throw new Error('Thrown'); else return (ready.result = ar.concat(3)); })
    .catch((er) => (ready.result = ready.result.concat(er)))
    .finally(() => console.log('finally', ready.result))
  );
})();
```
*/
export const when = (ready, args) => new Promise((resolve, reject) => {
  const test = typeof ready === 'function' ? ready
    : () => !(ready?.pending ?? +(ready?.done ?? ready?.progress ?? 1) < 1);
  let timeout = Number(ready?.timeout ?? 50e3);
  const min = Math.max(0, ~~Number(ready?.gap ?? 50));
  const max = Math.max(min, ~~Number(ready?.ease ?? timeout / 10));
  const grow = max > min ? 1.2 : 1;
  const timer = (lap = min) => {
    const ok = test();
    if (!ok && timeout > 0) {
      if (timeout < lap) { lap = timeout; }
      timeout -= lap; return setTimeout(timer, lap, ~~Math.min(max, lap * grow));
    }
    return ok ? resolve(args) : reject(new Error('Timeout'));
  };
  return timer();
});

/**
Debounces concurrent event triggers in favor of the last dispatch, or the first one, if lead is true.
Param delay. The interval threshold below which the dispatch is postponed. The default value is 300 ms.
Param fun. The callback function to be invoked.
Example: element.onresize = debounce((ev) => {...});
*/
export const debounce = (fun, delay = 300, lead = false) => {
  let timeout = 0;
  return (...args) => {
    const callnow = lead && !timeout;
    clearTimeout(timeout); timeout = +setTimeout(() => { timeout = 0; !lead && fun(...args); }, delay);
    callnow && fun(...args);
  };
};

/**
Throttles concurrent event triggers below a frequency interval.
Param delay. The frequency threshold below which the dispatch is skipped. The default value is 300 ms.
Param fun. The callback function to be invoked.
Example: element.onresize = throttle((ev) => {...});
*/
export const throttle = (fun, delay = 300) => {
  let last = null, timeout = 0;
  return (...args) => {
    if (last != null) {
      clearTimeout(timeout); timeout = +setTimeout(() => {
        const now = Date.now(); if (now - last >= delay) { fun(...args); last = now; }
      }, delay + last - Date.now());
    } else { fun(...args); last = Date.now(); }
  };
};

/** Simple fetch wrapper with an optional callback. */
export const callFetch = (url, callback = null, resolver = null, options = null) => {
  let content, error;
  return fetch(url, options ?? {})
    .then((response) => {
      if (!response.ok) throw Error(`${response.status} ${response.statusText}`);
      return response[resolver ?? 'text']?.();
    })
    .then((cont) => (content = cont))
    .catch((err) => (error = err))
    .finally(() => callback?.(url, content, error));
};

/* * */
