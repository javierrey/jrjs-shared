// utils/core.js
// _@ts-check

import {
  //
} from '../../lib/core/core-x.js';

export * from '../../lib/core/core-x.js';

/* Types functionality: */

/* String and RegExp transformations: */

/** Finds the index of the first difference between two texts. */
export const indexOfDifference = (text1, text2, start = 0, end = NaN) => {
  if (isNaN(end)) { end = Math.max(text1.length, text2.length); }
  const finish = Math.min(text1.length, text2.length, end);
  end = finish - 1;
  for (let i = start; i <= end; i++) {
    if (text1[i] !== text2[i]) { return i; }
    if (text1[end] === text2[end]) { end--; }
  }
  return text1.length === text2.length ? -1 : finish;
};

/** Splits a long text into chunks of a maximum length. */
export const splitLongText = (text, max) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += max) {
        chunks.push(text.slice(i, i + max));
    }
    return chunks;
};

/**
Gets the brackets range indices of a nested character index in a string (end excluding).
*/
export const getBracketsRange = (text, index, opb = '(', clb = ')') => {
  let start = text[index] === opb ? index : 0;
  let end = text[index] === clb ? index + 1 : text.length;
  let level = 0;
  for (let i = index - 1; i >= start; i--) {
    if (text[i] === opb && --level < 0) { start = i; break; }
    if (text[i] === clb) { level++; }
  }
  level = 0;
  for (let i = index + 1; i < end; i++) {
    if (text[i] === clb && --level < 0) { end = i + 1; break; }
    if (text[i] === opb) { level++; }
  }
  return [start, end];
};

/* Object transformations and String parsers: */

/** Stringifies a UTC date to format `...9999-12-31 Fr 23:59:59.999`. */
export const renderUTC = (date = new Date()) => {
  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], day = DAYS[date.getUTCDay()];
  return date.toISOString().replace('T', ` ${day} `).slice(0, -1);
};

/** Parses a UTC date string produced by `renderUTC`, in format `...9999-12-31 Fr 23:59:59.999`. */
export const parseUTC = (dateString) => {
  const now = new Date(), i0 = dateString?.indexOf(' '), i1 = dateString?.lastIndexOf(' ');
  return i0 === i1 ? now : new Date(`${dateString.slice(0, i0)}T${dateString.slice(i1 + 1)}Z`);
};

/* Arrays and iterables: */

/** API for sparse arrays defined by index keys. */
export const ArrayK = (() => {
  const typename = 'ArrayK';
  /** constructor method */
  const main = (array) => {
    let index = [];
    const refresh = () => { index = Object.keys(array).map(Number); };
    const keys = (from = 0, to = array.length) => {
      if (from <= 0 && to >= array.length) { return index; }
      if (from in array && to in array) { return index.slice(index.indexOf(from), index.indexOf(to)); }
      return index.filter((v) => v >= from && v < to);
    };
    const values = (from, to) => keys(from, to).map((k) => array[k]);
    const entries = (from, to) => keys(from, to).map((k) => [k, array[k]]);
    const prevKey = (idx) => index[index.indexOf(idx) - 1] ?? keys(0, idx).at(-1) ?? -1;
    const nextKey = (idx) => index[(index.indexOf(idx) + 1) || -1] ?? keys(idx + 1)[0] ?? -1;
    const lowerKey = (idx) => idx in array ? idx : prevKey(idx);
    const upperKey = (idx) => idx in array ? idx : nextKey(idx);
    const prevEntry = (idx) => { const k = prevKey(idx); return [k, array[k]]; };
    const nextEntry = (idx) => { const k = nextKey(idx); return [k, array[k]]; };
    const lowerEntry = (idx) => { const k = lowerKey(idx); return [k, array[k]]; };
    const upperEntry = (idx) => { const k = upperKey(idx); return [k, array[k]]; };
    const get = (key) => array[key];
    const set = (key, value) => {
      const isKey = key in array; array[key] = value; if (isKey) { return; }
      const k = nextKey(key); k < 0 ? index.push(key) : index.splice(index.indexOf(k), 0, key);
    };
    const del = (key) => { delete array[key]; const i = index.indexOf(key); i > -1 && index.splice(i, 1); };
    refresh();
    return Object.freeze({
      get source() { return array; },
      refresh, keys, values, entries,
      prevKey, nextKey, lowerKey, upperKey,
      prevEntry, nextEntry, lowerEntry, upperEntry,
      get, set, del,
    });
  };
  /** public static members */
  const members = {
    typename,
    isSparse: (array) => array.length !== Object.keys(array).length,
    positiveIndex: (array, idx) => !idx ? 0 : idx < 0 ? Math.max(idx, -array.length) + array.length : +idx,
    isIndex: (array, idx) => {
      const index = +idx;
      return parseInt(idx) === index && String(idx) === String(index) && index >= 0 && index < array.length;
    },
    hasIndex: (array, idx) => idx in array && members.isIndex(array, idx),
    assign: (target, source) => {
      const length = target.length; target.length = length + source.length;
      for (let i = 0; i < source.length; i++) { target[length + i] = source[i]; }
      return target;
    },
  };
  return Object.freeze(Object.assign(main, members));
})();

/** Appends an array to an existing array. Avoids `push` parameter length limit. */
export const assignArray = (target, source) => {
  const length = target.length; target.length = length + source.length;
  for (let i = 0; i < source.length; i++) { target[length + i] = source[i]; }
  return target;
};

/* Flow and event functionality: */

/* Client string functionality: */

/**
Unescapes HTML entities in a string.
Source: '&#74; &#x4a; &#x4A; &lt;&nbsp;&gt; &#96; &quot; &apos; &num; &amp;'
Result: 'J J J < > ` " \' # &'
Locale language entities are not included, as all language symbols are valid UTF-8 characters.
*/
export const unescapeHTMLEntities = (html) => {
  return html.replace(/&(#[xX]?[0-9A-Fa-f]{1,5}|[A-Za-z0-9]{1,32});/g, (m) => {
    if (m[1] === '#') {
      return m[2] === 'x' || m[2] === 'X' ?
        String.fromCharCode(parseInt(m.slice(3, m.length - 1), 16))
        : String.fromCharCode(parseInt(m.slice(2, m.length - 1), 10));
    }
    switch(m) {
      case '&nbsp;': return ' '; case '&quot;': return '"'; case '&apos;': return "'";
      case '&lt;': return '<'; case '&gt;': return '>';
      case '&num;': return '#'; case '&amp;': return '&';
      default: return m;
    }
  });
};

/**
Removes mark-up tags returning a plain text.
Inline styles, scripts and comments are removed too.
HTML source:
`
<Div>
<!-- a > b & a < b -->
<![CDATA[ a > b & a < b ]]>
<p><B><I>Plain</i></b> <span class="">content</span>:<Br/>Some text.</P>
<Style data-type="">a > b & a < b</style>
<P><B><I>Equation</i></b>:<Hr/>a &gt; b & a &lt; b</p>
<Script data-type="">a > b & a < b</script>
<P>Entities:<Br/>&#74; &#x4a; &#x4A; &lt;&nbsp;&gt; &#96; &quot; &apos; &num; &amp;</p>
</Div>
`
Result (using `unescapeHTMLEntities` and `removeEmptySpaces`):
'Plain content:\nSome text.\nEquation:\na > b & a < b\nEntities:\nJ J J < > ` " \' # &'
*/
export const extractInnerText = (html) => {
  return html // .replace(/=("|')(?!\1).+\1/g, '=$1$1') // remove attribute values, off
    .replace(/<(style|script)(\s[^>]*)*>(?!<\/\1>).*<\/\1>/gi, '') // remove inline scripts and styles
    .replace(/<!\[CDATA\[(?!]]>).*]]>/gi, '') // remove CDATA blocks
    .replace(/<!--(?!-->).*-->/g, '') // remove comments
    .replace(/<\/?([abiq]|abbr|bdo|cite|code|dfn|em|kbd|samp|small|span|strong|sub|sup|time|var)(\s[^>]*)*>/gi, '') // remove inline tags
    .replace(/<[^>]*>/g, '\n') // remove block tags
  ;
};

/**
Applies a data object to a string content or HTML template using placeholders for values, containers and iterators.
By default, uses the Handlebars placeholder syntax. Optionally, placeholders can be defined in the syntax parameter:
  `{ OP: '{{', CL: '}}', CC: '#', CN: '^', CE: '/', JS: 'js:' }`
For instance, a template may use the syntax convention `{ OP: '#{', CL: '}' }` for localized replacements.
Dot separated keys resolve nested values. Keys starting with a dot will be resolved from the top of the data object.
Additionally, placeholder keys starting with `js:` will be replaced by their parsed expression.
Test example:
  renderTemplate(
    `<ul>
    {{#listArray}}
      <li data-id="{{itemName}}-{{@key}}" data-value="{{@value}}">
      {{js:'\x7b\x7b\x7d\x7d'}}
      {{.listArray.0.itemName}} {{listObject.lo0}}
      {{#isImportant}}<b>{{itemValue}}</b>{{/isImportant}}
      {{#listArray}}AA{{/listArray}}
      {{^isImportant}}<i>{{itemValue}}</i>{{/isImportant}}
      {{^listArray}}BB{{/listArray}}
      {{#listObject}}
        CC {{lo0}}
        <ul>
        {{#lo1}}
          <li data-id="item-{{@key}}" data-value="{{@value}}">
          DD {{@key}}, {{@value}}, {{#@value}}EE{{/@value}}, {{^@value}}FF{{/@value}}, {{lo11}}.
          </li>
        {{/lo1}}
        </ul>
      {{/listObject}}
      </li>
    {{/listArray}}
    </ul>`,
    {
      listArray: [
        { itemName: 'itemA', itemValue: 'Regular value {{}}', listArray: true },
        { itemName: 'itemB', itemValue: 'Important value {{}}', isImportant: true },
        { itemName: 'itemC', listObject: { lo0: 'Lo0v', lo1: ['Lo10v', { lo11: 'Lo11v' }] } }
      ]
    }
  );
Will return string:
  `<ul>
    <li data-id="itemA-0" data-value=""> itemA AA <i>Regular value {{}}</i> </li>
    <li data-id="itemB-1" data-value=""> itemA <b>Important value {{}}</b> BB </li>
    <li data-id="itemC-2" data-value=""> itemA Lo0v <i></i> BB CC Lo0v
      <ul>
        <li data-id="item-0" data-value="Lo10v"> DD 0, Lo10v, EE, , . </li>
        <li data-id="item-1" data-value=""> DD 1, , , FF, Lo11v. </li>
      </ul>
    </li>
  </ul>`
*/
export const renderTemplate = (content, data, syntax) => {
  syntax ||= {};
  const OP = syntax.OP || '{{', CL = syntax.CL || '}}', CC = syntax.CC || '#';
  const CN = syntax.CN || '^', CE = syntax.CE || '/';
  const CK = syntax.CK || '@key', CV = syntax.CV || '@value', JS = syntax.JS || 'js:';
  const ol = OP.length, cl = CL.length, jl = JS.length, c0 = OP[ol - 1], c1 = CL[cl - 1];
  const rx = new RegExp(`[\\${CC}\\${CN}\\${CE}\\${c0}\\${c1}]`, 'g');
  const jx = /\\x([0-9A-Fa-f]{2})/g, ju = /\\u([0-9A-Fa-f]{4})/g;
  const isPrimitive = (v) => !v || [Boolean, Number, String, BigInt, Symbol].includes(v.constructor);
  const parse = (exp, ctx = {}) => {
    try { return Function(`{${Object.keys(ctx)}}`, `return(${exp})`)(ctx); } catch { return undefined; }
  };
  const render = (con, dat) => {
    let i, j, k, n = 0; if (!con || dat == null) { return con; }
    if (!isPrimitive(dat[CV])) { k = dat[CK] || 0; dat = dat[CV]; dat[CK] = k; }
    while ((i = con.indexOf(OP, n)) !== -1 && (j = con.indexOf(CL, (n = i + ol))) !== -1) {
      if (con[n] === c0 && con[j + cl] === c1) { j++; n++; }
      const isNot = (con[n] === CN);
      let klen = 0, param = null, sub = '', val = '', key = con.slice(n, j).trim();
      if (jl && key.slice(0, jl) === JS) {
        key = key.replace(jx, '\\x$1').replace(ju, '\\u$1'); param = parse(key.slice(jl));
      } else {
        key = key.replace(rx, ''); klen = key.length; k = key.split('.');
        if (!k[0]) { k.shift(); param = data; } else { param = dat; }
        while (k.length && param) { param = param[k.shift()]; }
      }
      if (klen && (isNot || con[n] === CC)) {
        n = j + cl; k = con.indexOf(OP + CE + key + CL, n);
        while (k !== -1 && ((sub = con.slice(n, k)).indexOf(OP + CC + key + CL) !== -1
          || sub.indexOf(OP + CN + key + CL) !== -1
        )) { n = k + ol + 1 + klen + cl; k = con.indexOf(OP + CE + key + CL, n); }
        if (k === -1) { k = con.length; }
        sub = con.slice(j + cl, k); j = k + ol + 1 + klen;
        if (!isNot && !isPrimitive(param)) {
          if ('forEach' in param.constructor.prototype) {
            param.forEach((v, p) => {
              if (isPrimitive(v)) { k = v; v = {}; v[CV] = k; } v[CK] = p; val += render(sub, v);
            });
          } else { param[CK] = key; val = render(sub, param); }
        } else { param = isNot ? !param : !!param; val = !param ? '' : render(sub, dat); }
      } else { val = param; }
      val = (val == null) ? '' : '' + val; con = con.slice(0, i) + val + con.slice(j + cl);
      n = i + val.length;
    }
    return con;
  };
  return render(content, data);
};

/* * */
