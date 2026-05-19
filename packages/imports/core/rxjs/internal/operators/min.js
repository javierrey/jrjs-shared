import { reduce } from './reduce.js';
import { isFunction } from '../util/isFunction.js';
export function min(comparer) {
    return reduce(isFunction(comparer) ? (x, y) => (comparer(x, y) < 0 ? x : y) : (x, y) => (x < y ? x : y));
}
//# sourceMappingURL=min.js.map