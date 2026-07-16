// lib/.../view.js, DOM
// _@ts-check

/**
@typedef {import('../core/core.js').PlainObject} PlainObject;
@typedef {typeof globalThis & Window | WorkerGlobalScope} ViewContext;
*/

import {
  callFetch,
  log, mdToHtml, rebaseLinks, 
} from '../core/core.js';

export * from '../core/core.js';

/** View primary config. */
export const viewConfig = /** @type {PlainObject} */ ({});

/** Safe element selector shortcuts. */
export const ge = (id) => document.getElementById(id);
export const gt = (tag, el = document) => el?.getElementsByTagName?.(tag);
export const qs = (sel, el = document) => { try { return el?.querySelector?.(sel); } catch {} };
export const qa = (sel, el = document) => { try { return el?.querySelectorAll?.(sel); } catch {} };

/**
Loads CSS code from a URL `href`, or from a given text, if `code` is not null.
The `href` is also used to construct the element's `id` and replace the style
previously loaded from the same resource.
If `keep` is true, the `id` is made unique, so the style will not be replaced
in further loads from the same resource.
*/
export const loadStyle = (href, code = null, keep = false) => {
  const id = new URL(href ?? '', location).pathname + (keep ? `-${Date.now()}` : '');
  let style = document.getElementById(id); style?.remove();
  if (code) { style = document.createElement('style'); style.textContent = code; }
  else { style = document.createElement('link'); style.rel = 'stylesheet'; style.href = href; }
  style.id = id; document.head.appendChild(style);
  return style;
};

/**
Loads and runs a script from a URL if `src` is defined,
or from an optional `code` otherwise.
*/
export const loadScript = (src, code = null, type = null) => {
  const script = document.createElement('script');
  script.type = type ?? 'application/javascript';
  src ? (script.src = src) : (script.textContent = code ?? '');
  document.head.appendChild(script); script.remove();
  return script;
};

/**
Inserts content into an HTML parent element.
Using `position` empty `''` replaces the parent's content. Default is `beforeend`.
New scripts in the content are also loaded and run, unless `norun` is true.
*/
export const insertHtml = (html, parent = null, position = null, norun = false) => {
  html = ((doc) => {
    const ind = doc.search(/<\/head>/i); if (ind < 1) return doc;
    const div = document.createElement('div');
    div.insertAdjacentHTML('beforeend', doc.slice(0, ind));
    div.replaceChildren(...div.querySelectorAll('script, style, link'));
    div.insertAdjacentHTML('beforeend', doc.slice(ind));
    return div.innerHTML;
  })(html ?? '');
  parent = (typeof parent === 'string' ? qs(parent) : parent) ?? document.body;
  position = position === 'all' ? '' : position ?? 'beforeend';
  const getScripts = norun ? (_) => [] : (el) => [...el.getElementsByTagName('script')];
  const scripts = getScripts(parent);
  position ? parent.insertAdjacentHTML(position, html) : (parent.innerHTML = html);
  getScripts(parent).forEach(
    (script) => !scripts.includes(script) && loadScript(script.src, script.textContent, script.type)
  );
};

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

/**
CSS functionality.
Usage:
`CSSUtil({ themed: 'colt', themes: ['coll', 'cold'] }); CSSUtil.toggleCssTheme();`
`const dbS = CSSUtil.getElementStyle(document.body); dbS.set('opacity', '0'); dbS.add('fade-in');`
```
const varValue = CSSUtil.getCssVariable('var-name');
CSSUtil.setCssVariable('var-name', varValue.replace('-light-', '-dark-'));
```
*/
export const CSSUtil = (() => {
  const typename = 'CSSUtil';
  const registry = {};

  const buildRegistry = (themed, themes) => {
    /** @type {{ rules: object[], variables: object, themes: string[], themed: string }} */
    const reg = { rules: [], variables: {}, themes: [], themed };
    const sheets = [...document.styleSheets];
    sheets.forEach((sheet) => {
      reg.rules.push(...[...sheet.cssRules]);
      reg.rules.forEach((rule) => {
        for (let i = 0; i < (rule.style?.length ?? 0); i++) {
          const style = rule.style[i];
          if (!style.startsWith('--')) { continue; }
          reg.variables[style] ??= rule;
          reg.themes.length < themes.length && themes.forEach((theme) => {
            !reg.themes.includes(theme) && style.includes(`-${theme}-`) && reg.themes.push(theme);
          });
        }
      });
    });
    return reg;
  };

  const emptyObject = (obj) => Object.keys(obj).forEach((k) => delete obj[k]);

  const updateRegistry = (themed = registry.themed ?? '', themes = registry.themes ?? []) => {
    emptyObject(registry); Object.assign(registry, buildRegistry(themed, themes));
  };

  /** @param {string} name, @param {HTMLElement | CSSStyleDeclaration} style */
  const getCssVariable = (name, style, pseudo = '') => {
    style ??= document.documentElement;
    if ('attributes' in style) { style = getComputedStyle(style, pseudo); }
    return ('style' in style ? style.style : style).getPropertyValue(name);
  };

  /** @param {string} name, @param {string} value, @param {HTMLElement | CSSStyleDeclaration} style */
  const setCssVariable = (name, value, style, priority = '') => {
    style ??= document.documentElement;
    ('style' in style ? style.style : style).setProperty(name, value ?? '', priority);
  };

  /** @param {HTMLElement} element */
  const getElementStyle = (element, pseudo = '') => {
    const style = element.style, classes = element.classList;
    const resolved = getComputedStyle(element, pseudo), computed = element.computedStyleMap?.();
    const get = (prop) => resolved[prop];
    const set = (prop, value, priority = '') => style.setProperty(prop, value ?? '', priority);
    const add = (...names) => classes.add(...names);
    const remove = (...names) => classes.remove(...names);
    const update = (...props) => props.forEach((prop) => set(prop, get(prop)));
    const replace = (oldNames, newNames) => {
      remove(...oldNames?.split ? [oldNames] : oldNames ?? []);
      add(...newNames?.split ? [newNames] : newNames ?? []);
    };
    return { resolved, computed, get, set, add, remove, update, replace };
  };

  const toggleCssTheme = (themeIndex = -1) => {
    if (!registry?.themes?.length || !registry.themed) { return; }
    const themed = `-${registry.themed}-`;
    const variables = Object.entries(registry.variables);
    const themedVariable = variables.find(([k, v]) => k.includes(themed)) ?? [];
    const themedValue = getCssVariable(themedVariable[0], themedVariable[1]);
    let currentIndex = registry.themes.findIndex((theme) => themedValue.includes(`-${theme}-`));
    if (currentIndex < 0) { currentIndex = 0; }
    const valueSearch = `-${registry.themes[currentIndex]}-`;
    if (themeIndex < 0) { themeIndex = Math.max(currentIndex - themeIndex, 0); }
    themeIndex %= registry.themes.length;
    if (themeIndex === currentIndex) { return; }
    const valueReplacer = `-${registry.themes[themeIndex]}-`;
    variables.forEach(([varName, varRule]) => {
      const currentValue = getCssVariable(varName, varRule);
      const newValue = currentValue.replace(valueSearch, valueReplacer);
      setCssVariable(varName, newValue, varRule);
    });
  };

  /** constructor method
  Updates the static CSS registry for themed variable replacements.
  @param {{ themed: string; themes: string[]; }} _0, @return {void}
  */
  const main = ({ themed, themes }) => updateRegistry(themed, themes);

  /** public static members */
  const members = {
    typename, registry, updateRegistry, toggleCssTheme,
    getCssVariable, setCssVariable, getElementStyle,
  };

  return Object.freeze(Object.assign(main, members));
})();

/* * */
