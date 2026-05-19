// mathfun.js // MIT License Copyright 2024 javier.rey.eu@gmail.com
// _@ts-check
/**
Builds a functional calculator object from a mathematical expression string.
The parsed functional object can be reused for calculations with different parameters.
The `expression` string parameter can contain constants, variables, operators and functions.
The `options` object parameter can contain custom function and constant definitions,
to extend the object's internal entities, which already include all `Math` members.
The functional object exposes method `calculate`, which can take different variable inputs:
`const functional = MathFun('x + t'), result = functional.calculate({ x: 2, t: 1 }); // 3`
The functional also provides a `plot` method to produce a range of variables-result tuples,
interpolating variables from a `start` state to an `end` state set.
Only variables present in the `end` set are interpolated, the rest remain constant.
The result is an array of coordinate tuples, containing the interpolated variables as abscissas,
in the same order as the `end` set keys, plus the computed result ordinate in the last position.
`const points = functional.plot({ t: -1, x: -2 }, { x: 2 }); // [[-2, -3] ... [2, 1]]`
To include non-interpolated variables in the result coordinate tuples, they can be inserted
in the `end` set, with value `NaN` or nullish.
`const points = functional.plot({ t: -1, x: -2 }, { x: 2, t: NaN }); // [[-2, -1, -3] ... [2, -1, 1]]`
The internal variables object is stateful, so if the `start` set is null or lacks some variables,
the plot travel begins with the latest previously assigned values.
Optional parameter `steps` in the `plot` method determines the domain resolution (default 1000).
The `plot` method uses a safe filter to skip invalid values and infinities, producing valid
coordinates for graphics rendering purposes.
The mathematical expression parser is based on a reverse (postfix) notation technique,
using an extended set of tokenizers to handle efficiently constants, variables, operators
and functions of variable arity. Javascript native evaluation methods are not used.
*/
export const MathFun = (() => {
  const typename = 'MathFun';

  const constants = {
    PI: Math.PI, E: Math.E,
    LN2: Math.LN2, LN10: Math.LN10, LOG10E: Math.LOG10E, LOG2E: Math.LOG2E,
    SQRT2: Math.SQRT2, SQRT1_2: Math.SQRT1_2,
    DEG: Math.PI / 180, PHI: 1.25 ** .5 + .5,
    C_MS: 299792458, H_JS: 6.62607015e-34,
  };

  const functions = (() => {
    const equal = (a, b, p = -14) => a === b || Math.sign(a) * Math.sign(b) >= 0 && Math.abs(b - a) < 10 ** p;
    const real = (v) => isNaN(v = Number(v)) || (v > -Number.MIN_VALUE && v < Number.MIN_VALUE) ? 0
      : v > Number.MAX_VALUE ? Number.MAX_VALUE : v < -Number.MAX_VALUE ? -Number.MAX_VALUE : v;
    const bexp = (n, b = 10) => !n ? 0 : Math.floor(Math.log(Math.abs(n)) / Math.log(b));
    const id = (v) => v;
    const num = (n) => Number(n);
    const neg = (n) => -n;
    const inv = (n) => 1 / n;

    const sum = (a, b) => a + b;
    const sub = (a, b) => a - b;
    const mul = (a, b) => a * b;
    const div = (a, b) => a / b;
    const mod = (a, b) => a % b;
    const root = (a, b) => Math.pow(a, 1 / b);
    const logB = (a, b) => Math.log(a) / Math.log(b);

    const is = (n) => !n ? 0 : 1;
    const not = (n) => !n ? 1 : 0;
    const bnot = (n) => ~n;
    const and = (a, b) => a & b;
    const or = (a, b) => a | b;
    const xor = (a, b) => a ^ b;
    const lsh = (a, b) => a << b;
    const rsh = (a, b) => a >> b;
    const rshu = (a, b) => a >>> b;

    const sums = (...a) => a.reduce((r, n) => r + n);
    const muls = (...a) => a.reduce((r, n) => r * n);
    const pows = (...a) => a.reverse().reduce((r, n) => n ** r);
    const lpows = (...a) => a.reduce((r, n) => r ** n);
    const poly = (x, ...a) => a.reduce((r, n, i) => r + n * x ** i, 0);
    const fact = (n, m = 1) => { let r = 1; while (n > m) r *= n--; return r; };
    const sumt = (n, m = 0) => { let r = 0; while (n > m) r += n--; return r; };
    const per = (n, p, o = 0) => (n - o) % p + (n < o ? p : 0);
    const wave = (x, p, r, ox = 0, oy = 0) => r * Math.sin(2 * Math.PI * (x - ox) / p) + oy;

    const mat = (...a) => a;
    const det = (m) => m.length === 1 ? m[0][0] : m.length === 2 ? m[0][0] * m[1][1] - m[0][1] * m[1][0] :
      m[0].reduce((a, v, i) => a + (-1) ** (i + 2) * v * det(m.slice(1).map((c) => c.filter((_, j) => i !== j))), 0);
    const toPolar = (x, y, z = 0) => {
      const r = Math.sqrt(x ** 2 + y ** 2 + z ** 2); return [r, Math.atan2(y, x), Math.asin(z / r)];
    };
    const fromPolar = (r, a, b = 0) => {
      const s = r * Math.cos(b); return [s * Math.cos(a), s * Math.sin(a), r * Math.sin(b)];
    };
    const ipow = (i, b) => b % 2 ? NaN : Math.sign(i) * i ** b;
    const randomFloat = (n0 = 0, n1 = 1) => n0 + n1 * Math.random(); // n1 excl
    const randomInt = (n0 = 0, n1 = 1) => n0 + Math.floor(Math.random() * (n1 - n0 + 1)); // n1 incl

    return {
      pow: Math.pow, sqrt: Math.sqrt, cbrt: Math.cbrt, hypot: Math.hypot,
      log: Math.log, log10: Math.log10, log2: Math.log2, log1p: Math.log1p, exp: Math.exp, expm1: Math.expm1,
      sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
      sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
      abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil, round: Math.round, trunc: Math.trunc,
      atan2: Math.atan2, max: Math.max, min: Math.min, random: Math.random,
      imul: Math.imul, clz32: Math.clz32, fround: Math.fround,
      equal, real, bexp, id, num, neg, inv,
      sum, sub, mul, div, mod, root, logB,
      is, not, bnot, and, or, xor, lsh, rsh, rshu,
      sums, muls, pows, lpows, poly, fact, sumt, per, wave,
      mat, det, toPolar, fromPolar, ipow, randomFloat, randomInt,
    };
  })();

  const operators = {
    '¬': { fun: functions.neg, precedence: 14 },
    '+': { fun: functions.sum, precedence: 11 },
    '-': { fun: functions.sub, precedence: 11 },
    '*': { fun: functions.mul, precedence: 12 },
    '/': { fun: functions.div, precedence: 12 },
    '%': { fun: functions.mod, precedence: 12 },
    '^': { fun: functions.pow, precedence: 13, associativity: -1 },
    '~': { fun: functions.root, precedence: 13, associativity: -1 },
  };

  const constantPrefixChar = '#', arityChar = '@';
  const openChar = '(', closeChar = ')', splitChar = ',', stringQuoteChar = '"';
  const operatorKeys = Object.keys(operators);
  const splitters = ',;:', openers = '({[', closers = ')}]';
  const boundaries = [...splitters, ...openers, ...closers, ...operatorKeys];
  const boundaryOpenerChars = operatorKeys + splitters + openers;

  //

  const equal = (o1, o2) => {
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

  const escapeSource = (source) => source.replace(/[-^$*+?|.,:=!<(){}/[\]\\]/g, '\\$&');

  const matches = (text, re, overlap = false) => {
    const matched = []; let match;
    if (!re.flags.includes('g')) { re = new RegExp(re.source, 'g' + re.flags); }
    while ((match = re.exec(text)) && match.index !== matched.at(-1)?.index) {
      matched.push({ index: match.index, length: match[0].length });
      if (overlap) { re.lastIndex = match.index + 1; }
    }
    return matched;
  };

  const unescapedMatches = (text, char, flags = '') => {
    const B = '\\\\', BB = `(${B + B})*`, echar = escapeSource(char);
    flags = flags.includes('g') ? flags : 'g' + flags;
    const re = new RegExp(`(?<=^${BB}|[^${B}]${BB})${echar}`, flags);
    return matches(text, re).map((v) => v.index);
  };

  const replaceWhile = (text, ...rexReps) => {
    while (rexReps.some(([rex, rep]) => rex.test(text = text.replace(rex, rep)))) { /* */ }
    return text;
  };

  const { compare: alphanumericCompare } = Intl.Collator('en', { numeric: true, caseFirst: 'upper' });

  const getDecimalNumberInContextRE = (chars = '') =>
    new RegExp(`[+-]?(?<=^|[^\\w${chars}])(?:\\d+\\.?\\d*|\\d*\\.?\\d+)(?:[eE][+-]?\\d+)?(?=[^\\w]|$)`, 'g');

  const toValue = (v) => !v || Array.isArray(v) || isNaN(v) ? v : Number(v);

  /** @param {Record<string, unknown>} vars @param {Record<string, unknown>} extra */
  const cloneVariables = (vars, extra = {}) => {
    extra = Object.assign({}, extra, vars);
    Object.entries(extra).forEach(([k, v]) => [undefined, null, NaN].includes(v) && delete extra[k]);
    return extra;
  };

  /** @param {Record<string, unknown>} vars @param {string[]} names */
  const pickVariables = (vars, names) => {
    /** @type {Record<string, unknown>} */ const pick = {};
    !names?.length ? Object.assign(pick, vars) : names.forEach((n) => pick[n] = vars[n] ?? 0);
    return pick;
  };

  const util = (() => {
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
    const unExp = ([m, e]) => m * 10 ** e;
    const roundExp = (n, p = -SAFE_MAN_HEX) =>
      [(p = Math.round((n = numExp(n))[0] * (p = 10 ** -p)) / p), p && n[1] ? n[1] : 0];
    const roundString = (v, p) => (v = roundExp(v, p))[0] + (v[1] ? `e${v[1]}` : '');
    const roundFloat = (v, p) => +roundString(v, p);
    const capReal = (v, l = SAFE_EXP_HEX) => {
      const h = 10 ** l; l = 1 / h; return isNaN(v = Number(v)) || (v > -l && v < l) ? 0 : v > h ? h : v < -h ? -h : v;
    };

    const safeEqual = (a, b) => equalExp(a, b, -SAFE_MAN_OCT);
    const safeRound = (v) => roundFloat(v, -SAFE_MAN_OCT);
    const safeReal = (v) => capReal(v, SAFE_MAN_OCT);
    const safeValue = (v) => v?.map?.((n) => safeValue(n)) ?? safeReal(v);
    const roundValue = (v) => v?.map?.((n) => roundValue(n)) ?? roundFloat(safeReal(v), -SAFE_MAN_NAT);

    const safePoint = (c) => [...c.slice(0, -1), safeReal(c.at(-1))];
    const safePath = (path) => path.filter((c) => !isNaN(c.at(-1))).map(safePoint);
    const roundPath = (path) => path.filter((c) => !isNaN(c.at(-1))).map(roundValue);
    const offsetPath = (path, ox = 0, oy = 0, zoom = 1, vscale = 1) => path.map(
      (coords) => safeValue([...coords.slice(0, -1).map((x) => x * zoom + ox), coords.at(-1) * zoom * vscale + oy])
    );

    return {
      SAFE_EXP_HEX, SAFE_EXP_OCT, SAFE_MAN_HEX, SAFE_MAN_OCT, SAFE_MAN_NAT,
      equalExp, dExp, numExp, unExp, roundExp, roundString, roundFloat, capReal,
      safeEqual, safeRound, safeReal, safeValue, roundValue,
      safePoint, safePath, roundPath, offsetPath,
    };
  })();

  //

  const extractStrings = (expression, constants, prefixChar, quoteChar) => {
    const quoteIndices = unescapedMatches(expression, quoteChar);
    const cKeys = Object.keys(constants), cValues = Object.values(constants);
    let lengthChange = 0;
    for (let i = 0; i < quoteIndices.length; i += 2) {
      const start = lengthChange + quoteIndices[i], end = lengthChange + quoteIndices[i + 1] + 1;
      const literal = expression.slice(start + 1, end - 1), prevLength = expression.length;
      let pos = cValues.indexOf(literal), name = cKeys[pos];
      if (!name) {
        pos = cValues.length; name = prefixChar + pos;
        constants[name] = literal; cKeys.push(name); cValues.push(literal);
      }
      expression = expression.slice(0, start) + name + expression.slice(end);
      lengthChange += expression.length - prevLength;
    };
    return expression;
  };

  const extractNumbers = (expression, constants, prefixChar) => {
    const decimalNumberInContextRE = getDecimalNumberInContextRE(prefixChar);
    const numberMatches = matches(expression, decimalNumberInContextRE);
    const cKeys = Object.keys(constants), cValues = Object.values(constants);
    let lengthChange = 0;
    numberMatches.forEach((match) => {
      const prevLength = expression.length, index = lengthChange + match.index;
      const value = Number(expression.slice(index, index + match.length)), absValue = Math.abs(value);
      let pos = cValues.indexOf(absValue), name = cKeys[pos];
      if (!name) {
        pos = cValues.length; name = prefixChar + pos;
        constants[name] = absValue; cKeys.push(name); cValues.push(absValue);
      }
      const replacer = (value < 0 ? '-' : '+') + name;
      expression = expression.slice(0, index) + replacer + expression.slice(index + match.length);
      lengthChange += expression.length - prevLength;
    });
    return expression;
  };

  const extractVariables = (expression, functions, constants) => {
    const variables = {};
    [...new Set(expression.split(/[^\w]+/).filter(
      (w) => isNaN(w) && !(w in functions) && !(w in constants)
    ))].sort(alphanumericCompare).forEach((k) => variables[k] = 0);
    return variables;
  };

  const normalize = (expression, functions, constants) => {
    expression = String(expression ?? '');
    expression = extractStrings(expression, constants, constantPrefixChar, stringQuoteChar);
    expression = expression.replaceAll('**', '^').replaceAll('//', '~').replace(/\s+/g, '');
    expression = replaceWhile(expression, [/(?:\+-|-\+)/g, '-'], [/(?:\+\+|--)/g, '+']);
    expression = extractNumbers(expression, constants, constantPrefixChar);
    expression = expression.replace(/\[/g, 'mat' + openChar).replace(/\]/g, closeChar)
      .replace(new RegExp(`(?<=^|[${boundaryOpenerChars}])\\-`, 'g'), '¬')
      .replace(new RegExp(`(?<=^|[${boundaryOpenerChars}])\\+`, 'g'), '');
    const variables = extractVariables(expression, functions, constants);
    if (expression in variables || expression in constants) { expression = `id(${expression})`; }
    return { expression, variables };
  };

  const tokenize = (normalized, boundaries, functions) => {
    const tokens = [], controls = [];
    for (let i = 0; i < normalized.length; i++) {
      boundaries.includes(normalized[i]) && controls.push(i);
    }
    controls.push(normalized.length);
    for (let i = 0; i < controls.length; i++) {
      const point = controls[i];
      const start = (controls[i - 1] ?? -1) + 1;
      const word = normalized.slice(start, point);
      const boundary = normalized[point];
      word && tokens.push(word);
      boundary && tokens.push(boundary);
      boundary === openChar && word in functions && tokens.push(arityChar);
    }
    return tokens;
  };

  const compile = (tokens, functions, constants) => {
    const executable = [], stack = [];
    for (const token of tokens) {
      if (token in operators) {
        if ((operators[token].associativity || 1) > 0) {
          let last = stack.at(-1);
          while (operators[last]?.precedence >= operators[token].precedence) {
            executable.push(stack.pop());
            last = stack.at(-1);
          }
        }
        stack.push(token);
      } else if (token === closeChar || token === splitChar) {
        while (stack.length && stack.at(-1) !== openChar) { executable.push(stack.pop()); }
        if (token === closeChar) {
          stack.at(-1) === openChar && stack.pop();
          stack.at(-1) in functions && executable.push(stack.pop());
        }
      } else if (token in functions || token === openChar) { stack.push(token);
      } else { executable.push(token in constants ? constants[token] : token); }
    }
    while (stack.length) { executable.push(stack.pop()); }
    return executable;
  };

  const reduce = (executable, operations, variables) => {
    const reduced = [];
    for (const token of executable) {
      let reducible = token in operations;
      if (reducible) {
        const op = operations[token], fun = op.fun ?? op, parameters = [];
        let arity = op.fun ? fun.length : -1, countdown = reduced.length;
        while (arity-- && countdown--) {
          const param = reduced.at(countdown);
          if (param in variables || param in operations) { reducible = false; }
          if (!reducible || param === arityChar) { break; }
          parameters.push(param);
        }
        if (reducible) {
          countdown = parameters.length + (!op.fun ? 1 : 0);
          while (countdown--) { reduced.pop(); }
          reduced.push(fun(...parameters.reverse().map(toValue)));
        }
      }
      !reducible && reduced.push(token);
    }
    return reduced;
  };

  const compute = (executable, operations, variables) => {
    const results = [];
    for (const token of executable) {
      if (token in operations) {
        const op = operations[token];
        const fun = op.fun ?? op;
        const parameters = [];
        let param, arity = op.fun ? fun.length : -1;
        while (arity-- && (param = results.pop()) !== arityChar) {
          if (param in variables) { param = variables[param]; }
          parameters.push(param);
        }
        results.push(fun(...parameters.reverse().map(toValue)));
      } else { results.push(token); }
    }
    return results[0];
  };

  //

  const newParse = (functions, constants) =>
    (expression) => { // const log = console.log; // eslint-disable-line -- @comment
      const operations = { ...operators, ...functions }; // log(0 ? `operations: {${Object.keys(operations)}}` : '', `\nexpression: "${expression}"`);
      const { expression: normalized, variables } = normalize(expression, functions, constants); // log(`normalized: "${normalized}"\nconstants: ${JSON.stringify(constants)}\nvariables: {${Object.keys(variables)}}`);
      const tokens = tokenize(normalized, boundaries, functions); // log(`tokens: [${tokens}]`);
      const compiled = compile(tokens, functions, constants); // log(`compiled: [${compiled}]`);
      const executable = reduce(compiled, operations, variables); // log(`reduced:  [${executable}]`);
      return { executable, operations, variables };
    };

  const newAssign = (variables) =>
    (vars) => Object.entries(vars).forEach(([k, v]) => { if (k in variables) { variables[k] = v; } });

  const newCalculate = (assign, executable, operations, variables) =>
    (vars) => {
      vars && assign(vars);
      return compute(executable, operations, variables);
    };

  const newCoordinates = (calculate, variables) =>
    (vars, varNames) => {
      const ordinate = calculate(vars); // updates variables
      vars = pickVariables(vars ?? variables, varNames);
      const abscissa = Object.values(vars);
      !abscissa.length && abscissa.push(0);
      return [...abscissa, ordinate];
    };

  const newPlot = (calculate, assign, variables) => {
    const coordinates = newCoordinates(calculate, variables);
    return (start, end, steps = 0) => {
      steps ||= 1e3; start = cloneVariables(start, variables); assign(start);
      const points = [], coordnames = Object.keys(end);
      variables = cloneVariables(variables); end = cloneVariables(end);
      !Object.keys(variables).length && Object.assign(variables, end, start);
      const calcnames = coordnames.filter((k) => k in variables && !equal(end[k], variables[k]));
      const base = calcnames.reduce((acc, vn) => (acc[vn] = variables[vn] ?? 0, acc), {});
      for (let i = 0; i <= steps; i++) {
        const interpolated = calcnames.reduce(
          (acc, vn) => (acc[vn] = base[vn] + (end[vn] - base[vn]) * i / steps, acc), {}
        );
        const coords = coordinates(interpolated, coordnames), res = coords.at(-1);
        !isNaN(res) && points.push(util.safePoint(coords));
      }
      return points;
    };
  };

  /** constructor method */
  const main = (expression, options = {}) => {
    const board = options.board ?? {};
    const customConstants = options.constants ?? {};
    const customFunctions = options.functions ?? {};

    const constants = { board, ...members.constants, ...customConstants };
    const functions = { ...members.functions, ...customFunctions };

    const parse = newParse(functions, constants);

    const { executable, operations, variables } = parse(expression);

    const assign = newAssign(variables);
    const calculate = newCalculate(assign, executable, operations, variables);
    const plot = newPlot(calculate, assign, variables);

    return Object.freeze({
      expression, variables, board, customConstants, customFunctions,
      assign, calculate, plot,
    });
  };

  /** public static members */
  const members = { typename, util, constants, functions };

  return Object.freeze(Object.assign(main, members));
})();
