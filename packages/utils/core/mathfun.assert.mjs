// mathfun.assert.mjs //  javier.rey.eu@gmail.com 2024
// _@ts-check

import assert from 'node:assert';
import { MathFun } from './mathfun.js';

const log = (...args) => args.forEach((arg) => console.log(arg && [Object, undefined].includes(arg.constructor) ? JSON.stringify(arg, null, 2) : arg)); // eslint-disable-line

const parse = (exp, ctx = {}) => {
  try { return Function(`{${Object.keys(ctx)}}`, `return(${exp})`)(ctx); } catch { return undefined; }
};

const decode = (ex) => ex.replaceAll('^', '**').replaceAll('~', '//').replaceAll('\\"', '\\\\\\"');

const constants = {
  ...MathFun.constants,
  K0: 6.62607015e-4, // e-34, e-4
  K1: 'Hi there \\"K1\\" con', // 'Hi there "K1" con', -1
  K2: [4, -3, 6],
};

const functions = {
  ...MathFun.functions,
  f0: () => 1,
  f1: (a, b) => a === b ? 0 : b / a - 1,
  f2: (...ar) => ar.join('').length,
  fa: (board, k, v) => { board[k] = (board[k] ?? 0) + v; return 0; },
  fb: (board, k, v) => { board[k] = v; return 0; },
  toPolarDeg: (...ar) => MathFun.functions.toPolar(...ar).map((v, i) => i ? v / constants.DEG : v),
};

const options = { functions, constants };

const scope = { ...constants, ...functions };

const test = (expression, variables = {}, message = '') => {
  const expected = parse(decode(expression), { ...variables, ...scope });
  const functional = MathFun(expression, options);
  const calculated = functional.calculate(variables);
  log(`calculate: ${!calculated ? calculated : JSON.stringify(calculated)}, ` + ((expected !== calculated) ? `expected: ${expected}` : 'OK'));
  assert.deepEqual(calculated, expected ?? calculated, message);
  return functional;
};

try {
  // numeric:
  1 && test('1');
  1 && test('1+1');
  1 && test('12* 123/-(-(5 * 1) + 2)');
  1 && test('  (2  + 3)  -  (6 / 2)  * (-3.14)    ');
  1 && test('12* 123/-(-(6 * -6) - 6)');
  // exp:
  1 && test('(4 ^ 3) ^ 2');
  1 && test('4 ^ 3 ^ 2');
  // variables:
  1 && test(' K0 ', {});
  1 && test(' x ', { x: 6 });
  1 && test('x+123/-(-(5 * -1) - 2)+x', { x: 6 });
  1 && test('12* 123/-(-(x * -x) - x)', { x: 6 });
  1 && test('x - 2 ^ 1.5 ^ (x/-5) / x ^ 2', { x: 6 });
  // functions:
  1 && test('-(-6 - pow(-6, sub(-4,-6))) / sin(PI/6)');
  1 && test('-(-x - pow(-x, -4 - -x)) / sin(-PI/-x)', { x: 6 });
  1 && test('-(-x - pow(-x, sub(-4,-6))) / sin(PI/x)', { x: 6 });
  1 && test('det([[1, 2, -3], [-1, 2, 3], [1, -2, 3]])');
  // variable arity functions:
  1 && test('-sums(-x,-2,-x)', { x: 6 });
  1 && test('-sums(-x,-2,-3,-muls(2,-x,3))', { x: 6 });
  1 && test('f0()+f0()', {});
  // non-numeric literals:
  1 && test('[2,4,x,8,-x,-x,[pow(-x,2),-x,3,4,pow(-x,2),-x,3,4,pow(-x,2),-x,3,4]]', { x: 6 });
  1 && test('[2,4,x,8,[-x,-x,2],1]', { x: 6 });
  1 && test('[2,4,x,8,-x,-x,[pow(-x,2),-x,3,4]]', { x: 6 });
  1 && test('f2("Hi there \\"lit\\"")', {});
  // board:
  if (1) {
    const expression = `
      + fa(board, "key0", 2) + fa(board, "key0", 3)
      + fb(board, "key1", [2,4,x,8,"Hi \\"ya\\"",pow(-x,2),pow(-x,3), [-root(3,-x)], 8])
      + fb(board, "toPol", toPolarDeg(1, 1, .5))
      + fb(board, "fromPol", fromPolar(1.5, 45 * DEG, 19.47122063449069 * DEG))
    `;
    const variables = { x: 6 };
    const expected = parse(decode(expression), { ...variables, ...scope });
    const functional = MathFun(expression, options);
    const calculated = functional.calculate(variables);
    log(`board: ${JSON.stringify(functional.board)}`);
    assert.deepEqual(calculated, expected ?? calculated, 'message');
  }
  // misc:
  if (1) {
    const expression = `
      f2() + xf2 + neg (-3) * -((4 + ((3.141592653589793 + y) - x + f2("Hi there \\"lit\\"", -K1, y) + f2("Hi there \\"lit\\"") + f2(xs0) + f2() + f2()) + xf2
      + (-x) - PI + x - neg(-sum(2,-2)) + x + x) / 2)
      * ( -PI - .5 + 2 -.25 + - 000 001 000 e - 000 003 -K0)
      * f1(4e-0, 5)
      / -sums(0,0,0) * +-((((-+1)+(+0)))) + xf2 + -f2() + 1.1 * -1.2 / -1.25 * -1.3 /2
    `;
    const variables = { x: 7, y: -10, xs0: 'Hi there \\"you v\\"' };
    const expected = parse(decode(expression), { ...variables, ...scope });
    const functional = MathFun(expression, options);
    functional.plot(null, { x: -3 }, 2);
    const plot = functional.plot(null, { x: 7 }, 2); // log(`plot: ${JSON.stringify(plot)}`);
    const calculated = plot.at(-1)?.[1]; log(`calculated: ${JSON.stringify(calculated)}, expected: ${expected}`);
    assert.deepEqual(calculated, expected ?? calculated, `message`);
  }
  log('ok');
} catch (er) {
  log(er);
} finally {
  log(`test end ${performance.now()} ms`);
}
