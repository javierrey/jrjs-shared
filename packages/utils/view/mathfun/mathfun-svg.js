// mathfun-svg.js // javier.rey.eu@gmail.com 2025
// _@ts-check

// MathFun util:

const SAFE_EXP_HEX = 306, SAFE_EXP_OCT = 34, SAFE_MAN_HEX = 14, SAFE_MAN_OCT = 7, SAFE_MAN_NAT = 2;

const equalExp = (a, b, p = -SAFE_MAN_HEX) => {
  if (a === b) { return true; }
  if (Math.sign(a) * Math.sign(b) < 0) { return false; }
  a = Math.abs(a); b = Math.abs(b); a = [Math.max(a, b), Math.min(a, b)]; b = a[0]; a = a[1];
  if (a) { b /= a; a = 1; }
  return b - a < 10 ** p;
};
const dExp = (n) => Math.floor(Math.log10(Math.abs(n || 1)));
const numExp = (n) => [n * 10 ** -(n = dExp(n)), n];
// const unExp = ([m, e]) => m * 10 ** e;
const roundExp = (n, p = -SAFE_MAN_HEX) => [(p = Math.round((n = numExp(n))[0] * (p = 10 ** -p)) / p), p && n[1] ? n[1] : 0];
const roundString = (v, p) => (v = roundExp(v, p))[0] + (v[1] ? `e${v[1]}` : '');
const roundFloat = (v, p) => +roundString(v, p);
const capReal = (v, l = SAFE_EXP_HEX) => {
  const h = 10 ** l; l = 1 / h; return isNaN(v = Number(v)) || (v > -l && v < l) ? 0 : v > h ? h : v < -h ? -h : v;
};

const safeEqual = (a, b) => equalExp(a, b, -SAFE_MAN_OCT);
const safeRound = (v) => roundFloat(v, -SAFE_MAN_OCT);
const safeReal = (v) => capReal(v, SAFE_MAN_OCT);
// const safeValue = (v) => v?.map?.((n) => safeValue(n)) ?? safeReal(v);
const roundValue = (v) => v?.map?.((n) => roundValue(n)) ?? roundFloat(safeReal(v), -SAFE_MAN_NAT);

const snapRound = (n, u = 1) => Math.floor(n / u) * u;

export const roundText = (v) => {
  if (v.map) { return v.map((n) => roundText(n)); }
  const a = Math.abs(v); return a >= .1 && a < 1e3 ? String(roundFloat(v, -SAFE_MAN_NAT)) : roundString(v, -SAFE_MAN_NAT);
};

// HTML/SVG:

export const findElements = (attr = {}, tag = '', parent = document) =>
  parent.querySelectorAll((tag ?? '') + Object.entries(attr).map(([k, v]) => `[${k}="${v}"]`).join(''));

export const clearContainer = (container) => {
  while (container.lastChild) { container.removeChild(container.lastChild); }
};

const addElement = (container, elem, direction = 0) =>
  direction < 0 ? container.insertAdjacentElement('afterbegin', elem) : container.append(elem);

const createSvgElement = (tag) => document.createElementNS('http://www.w3.org/2000/svg', tag);

const setSvgAttributes = (svge, attr = {}) => {
  for (const [key, value] of Object.entries(attr)) {
    svge.setAttributeNS(null, key, value);
  }
};

export const isPathData = (pathData) => /^M\s*[-+]?\d*\.?\d+(?:e[-+]?\d+)?\s*,\s*[-+\.\d]/.test(String(pathData).trim());

export const setViewBox = (svg, [ox, oy, w, h]) => svg.setAttributeNS(null, 'viewBox', `${ox} ${oy} ${w} ${h}`);
export const setViewRect = (svg, [ox, oy, ex, ey]) => setViewBox(svg, [ox, oy, ex - ox, ey - oy]);
export const setViewField = (svg, [cx, cy, w, h]) => setViewBox(svg, [cx - w / 2, cy - h / 2, w, h]);

export const getViewBox = (svg) => svg.getAttributeNS(null, 'viewBox')?.split(' ').map(Number);
export const getViewRect = (svg) => { const b = getViewBox(svg); return [b[0], b[1], b[0] + b[2], b[1] + b[3]]; }
export const getViewField = (svg) => { const b = getViewBox(svg); return [b[0] + b[2] / 2, b[1] + b[3] / 2, b[2], b[3]]; };

const unn = (n) => !n && n !== 0; // undefined, null, NaN, ...
export const rectCenter = ([l, b, r, t]) => [unn(r) ? 0 : (l + r) / 2, unn(t) ? 0 : (b + t) / 2];
export const rangeRect = (r, x, y) => unn(y) ? [x - r, x + r] : [x - r, y - r, x + r, y + r];
export const rangeDomain = (d = []) => d.length % 2 ? rangeRect(...d) : d.slice();
export const mergeRect = (p = [], r = []) => [(p = rangeDomain(p))[0], (r = rangeDomain(r))[1], p[3] ?? p[1], r[3]];
export const aspectRect = (d = [], r = []) => {
  if ((d = rangeDomain(d)).length > 3) {
    const cy = (d[3] + d[1]) / 2, ry = (r[3] - r[1]) / 2; d = [d[0], cy - ry, d[2], cy + ry];
  } else { d = mergeRect(d, r); }
  return d;
};
export const scaleRect = (r = [], x = 1, y = x) => r.map((v, i) => i % 2 ? v * y : v * x);

export const setSvgView = (/** @type {object} */ {
  cartesian = true, aspectMode = 'fit', minAspect = 1, maxAspect = 5,
  svg, paths, scaleX = 1, scaleY = 1, domain = [], zoom = 0, zoomDomain = [],
}) => {
  let minX = NaN, minY = NaN, maxX = NaN, maxY = NaN, maxDomain = 0, maxRange = 0;
  const zDomain = aspectRect(zoomDomain, scaleRect(domain, 1, zoom || 1));
  minX = zDomain[0]; maxX = zDomain[2]; maxDomain = maxX - minX;
  minY = zDomain[1]; maxY = zDomain[3]; maxRange = maxY - minY;
  maxDomain ||= 1; minX ||= 0; maxX ||= 0; if (safeEqual(minX, maxX)) { minX -= maxDomain / 2; maxX += maxDomain / 2; }
  maxRange ||= 1; minY ||= 0; maxY ||= 0; if (safeEqual(minY, maxY)) { minY -= maxRange / 2; maxY += maxRange / 2; }
  minX *= scaleX; maxX *= scaleX; minY *= scaleY; maxY *= scaleY; maxDomain = maxX - minX; maxRange = maxY - minY;
  const dAspect = maxDomain / maxRange, aspect = Math.min(Math.max(dAspect, minAspect), maxAspect), midY = (maxY + minY) / 2;
  if (!safeEqual(aspect, dAspect)) { maxRange = maxDomain / aspect; minY = midY - maxRange / 2; maxY = midY + maxRange / 2; }
  domain = [minX, minY, maxX, maxY];
  const svgAspect = svg.clientWidth / svg.clientHeight;
  const width = maxX - minX, height = width / svgAspect;
  const originX = minX, originY = (midY - height / 2);
  const box = roundValue([originX, originY, width, height]);
  setViewBox(svg, box);
  svg.setAttributeNS(null, 'transform', `scale(1,${cartesian ? -1 : 1})`);
  switch (aspectMode) {
    case 'min': svg.setAttributeNS(null, 'preserveAspectRatio', 'xMinYMin meet'); break;
    case 'fit': svg.style['aspect-ratio'] = box[2] / box[3]; break;
  }
  return { domain, box, scaleX, scaleY }; // Object.assign(svgProps, changes); return changes;
};

const createSvgPath = (type, attr = {}) => { // polyline, path
  type ||= 'polyline';
  const path = createSvgElement(type);
  attr.fill ??= 'none';
  attr['stroke-width'] ??= 1;
  attr['stroke'] ??= 'grey';
  attr['vector-effect'] ??= 'non-scaling-stroke';
  setSvgAttributes(path, attr);
  return path;
};

export const addHLine = (svge, y, span, stroke, strokeDasharray, direction, name) => {
  const line = createSvgPath('line', { x1: -span, y1: y, x2: span, y2: y, stroke, 'stroke-dasharray': strokeDasharray, name });
  addElement(svge, line, direction);
};

export const addVLine = (svge, x, span, stroke, strokeDasharray, direction, name) => {
  const line = createSvgPath('line', { x1: x, y1: -span, x2: x, y2: span, stroke, 'stroke-dasharray': strokeDasharray, name });
  addElement(svge, line, direction);
};

export const addCross = (svge, x, y, span, stroke, strokeDasharray, direction, name) => {
  addVLine(svge, x, span, stroke, strokeDasharray, direction, name);
  addHLine(svge, y, span, stroke, strokeDasharray, direction, name);
};

export const addSvgText = (svge, text, size, x, y, fill) => { // const width = parent.clientWidth, height = parent.clientHeight;
  return; // @todo
  x /= size; y /= -size;
  const label = createSvgElement('text');
  label.append(text);
  label.setAttributeNS(null, 'x', x);
  label.setAttributeNS(null, 'y', y);
  label.setAttributeNS(null, 'transform', `scale(${size},${-size})`);
  label.setAttributeNS(null, 'fill', fill ?? '#222222');
  addElement(svge, label);
};

export const addSvgGrid = (svge, box = [], scaleX = 1, scaleY = 1, stroke = 'grey', lowStroke = 'grey', highStroke = 'grey') => {
  const gridElem = createSvgElement('g');

  const width = box[2] * 1, height = box[3] * 1, centerX = box[0] + box[2] / 2, centerY = box[1] + box[3] / 2;
  const targetUnits = 5, gridUnit = 10 ** dExp(width / targetUnits), halfUnit = gridUnit / 2;
  const gCornerX = snapRound(centerX - width / 2, halfUnit), gCornerY = snapRound(centerY - height / 2, halfUnit);
  const gCellsX = Math.floor(width / halfUnit) + 1, gCellsY = Math.floor(height / halfUnit) + 1;

  const getStroke = (v) => safeEqual((v = safeRound(v / halfUnit)), 0) ? highStroke : safeEqual(v % 2, 0) ? stroke : lowStroke;

  for (let i = 0; i <= gCellsX; i++) {
    const x = gCornerX + i * halfUnit;
    addVLine(gridElem, x, width, getStroke(x));
  }

  for (let j = 0; j <= gCellsY; j++) {
    const y = gCornerY + j * halfUnit;
    addHLine(gridElem, y, height, getStroke(y));
  }

  addElement(svge, gridElem);
  return { gridUnit };
};

const scalePath = (path, scaleX, scaleY = scaleX) => {
  if (Array.isArray(path)) {
    path = path.map(([x, y]) => [scaleX * x, scaleY * y]);
  }
  return path;
};

const setSvgPath = (pathElem, /** @type { string | array } */ pathData = '') => {
  if (Array.isArray(pathData)) {
    if (!Array.isArray(pathData[0])) { pathData = pathData.map((data) => Object.values(data)); }
    pathData.map((point) => `${safeRound(point[0])},${safeRound(point[1])}`).join(' ');
  }
  const att = isPathData(pathData) ? 'd' : 'points';
  pathElem.setAttributeNS(null, att, pathData);
};

export const addSvgPaths = (svge, paths, scaleX, scaleY, direction) => {
  paths.forEach((path) => {
    const id = path.id, attr = path.attr ?? {};
    const xScale = scaleX * Math.abs(path.scaleX ?? 1);
    const yScale = scaleY * Math.abs(path.scaleY ?? 1);
    let lines = path.path ?? path;
    const type = isPathData(lines) ? 'path' : 'polyline';
    const pathElem = createSvgPath(type, { name: `svg-${id}`, ...attr });
    if (xScale !== 1 || yScale !== 1) {
      lines = scalePath(lines, xScale, yScale);
    }
    setSvgPath(pathElem, lines);
    addElement(svge, pathElem, direction);
  });
};
