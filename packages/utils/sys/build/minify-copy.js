// _@ts-check // minify-copy.js, javier.rey.eu@gmail.com, 2022
// dependencies: 'imports/sys/dev_modules/min_modules/*', 'lib/sys/sys-x.js'

/**
Minify and copy files from a source directory to a destination directory, preserving the directory structure.
The minification process is applied to specific file types, while others are copied unmodified.
Compressible file types: .html .htm .css .js .mjs .cjs .xml .xhtml .svg .dae .json .json5
Filenames containing .raw. or .min. are not modified, filenames containing .src., .test. or .spec. are skipped.
All other files are copied unmodified.

CLI stdout test examples for each file type, HTML, JS, CSS, XML, except JSON (internal):
`node ./packages/imports/sys/dev_modules/min_modules/html-minifier-terser/cli.js --collapse-whitespace --remove-comments --minify-js true --minify-css true  "./lib/jrjs/mintest/index.html"`
`node ./packages/imports/sys/dev_modules/min_modules/terser/bin/terser "./lib/jrjs/mintest/core.js"`
`node ./packages/imports/sys/dev_modules/min_modules/clean-css/cli.js "./lib/jrjs/mintest/aa-lib.css" "{}"`
`node ./packages/imports/sys/dev_modules/min_modules/minify_xml_modules/minify-xml/cli.js "./lib/jrjs/mintest/main-logo.svg"`
*/
// '../../../', 'jrjs-shared'
import { minify as minify_js } from '../../../imports/sys/dev_modules/min_modules/terser/dist/bundle.min.js';
import CleanCSS from '../../../imports/sys/dev_modules/min_modules/clean-css/index.js';
import { minify as minify_html } from '../../../imports/sys/dev_modules/min_modules/html-minifier-terser/dist/htmlminifier.js';
import { minify as minify_xml } from '../../../imports/sys/dev_modules/min_modules/minify_xml_modules/minify-xml/index.js';

import { clone, merge, parse, fs, fsP, log, getPathCore, getAllFiles, removeDir } from '../../../lib/sys/sys-x.js';

const minify_css = CleanCSS.process;

const minify_json = (data, options) => {
  try { // JSON RegExp: Complex values inducing false positives will use parseObject.
    const isJson5 = !options?.skipJson5 && /[^"\s]\s*:/g.test(data);
    data = JSON.stringify(isJson5 ? parse(data) : JSON.parse(data)) ?? data;
  } catch (_) {}
  return data;
};

/* * */

const encoding = 'utf8';

const srcRE = /\.(src|test|spec|assert)\./i;
const rawRE = /\.(raw|min|bin)\./i;

const htmlRE = /\.html?$/i;
const cssRE = /\.css$/i;
const jsRE = /\.[mc]?js$/i;
const xmlRE = /\.(xml|xhtml|svg|dae)$/i;
const jsonRE = /\.json5?$/i;

const defaultConfig = {
  html: { // html-minifier-terser
    minifyCSS: true,
    minifyJS: true,
    minifyURLs: false,
    collapseWhitespace: true,
    removeComments: true,
    keepClosingSlash: false,
  },
  css: { // clean-css
    level: 1,
    returnPromise: true,
    rebaseTo: undefined, // undefined to preserve URLs
    inlineTimeout: 5000,
    compatibility: {},
    format: {},
  },
  js: { // terser
    ecma: 2024, // `_` prefix name to ignore
    parse: {},
    compress: {},
    mangle: false || { //  `||` to use mangle, `&&` to disable it
      properties: false && {}, //  `&&` to disable props, `||` to use them (do not use with modules)
    },
    format: {},
    module: true,
    keep_fnames: false,
    keep_classnames: false,
  },
  xml: { // minify-xml
    collapseEmptyElements: false,
    ignoreCData: true,
  },
  json: { // internal (using jrjs/core)
    skipJson5: false,
  },
};

const config = clone(defaultConfig);

export const configMinify = (options) => merge(config, getOptions(options));

export const runMinify = (orig, dest, options) => minifyDir(orig, dest, getOptions(options));

const getOptions = (options) => {
  if (options?.constructor === String) { options = parse(options); }
  return merge(clone(config), options);
};

const minifyDir = async (orig, dest, options) => {
  log.info(`minifyDir: "${orig}" > "${dest}"`, options);
  removeDir(dest);
  for await (const file of getAllFiles(orig)) {
    minifyFile(file, orig, dest, options);
  }
};

const minifyFile = (file, orig, dest, options) => {
  if (srcRE.test(file)) { return; }
  file = file.replace(/\\/g, '/'); options ??= {};
  const target = file.replace(getPathCore(orig), getPathCore(dest));
  log.info(`target: ${target}`);
  fs.mkdirSync(target.slice(0, target.lastIndexOf('/') + 1), { recursive: true });
  if (rawRE.test(file)) { fsP.copyFile(file, target);
  } else if (htmlRE.test(file)) { minifyHTML(file, target, options.html);
  } else if (cssRE.test(file)) { minifyCSS(file, target, options.css);
  } else if (jsRE.test(file)) { minifyJS(file, target, options.js);
  } else if (xmlRE.test(file)) { minifyXML(file, target, options.xml);
  } else if (jsonRE.test(file)) { minifyJSON(file, target, options.json);
  } else { fsP.copyFile(file, target); }
};

const minifyHTML = async (file, target, options) => {
  let data = await fsP.readFile(file, encoding);
  try { data = await minify_html(data, options); } catch (_) {}
  fsP.writeFile(target, data, encoding);
};

const minifyCSS = async (file, target, options) => {
  let data = await fsP.readFile(file, encoding);
  try {
    const { css } = await minify_css(data, options);
    data = css;
  } catch (_) {}
  fsP.writeFile(target, data, encoding);
};

const minifyJS = async (file, target, options) => {
  let data = await fsP.readFile(file, encoding);
  try {
    const { code } = await minify_js(data, options);
    data = code;
  } catch (_) {}
  fsP.writeFile(target, data, encoding);
};

const minifyXML = async (file, target, options) => {
  let data = await fsP.readFile(file, encoding);
  try { data = minify_xml(data, options); } catch (_) {}
  fsP.writeFile(target, data, encoding);
};

const minifyJSON = async (file, target, options) => {
  let data = await fsP.readFile(file, encoding);
  data = minify_json(data, options);
  fsP.writeFile(target, data, encoding);
};
