import { mergeMap } from './mergeMap.js';
import { isFunction } from '../util/isFunction.js';
export function mergeMapTo(innerObservable, resultSelector, concurrent = Infinity) {
    if (isFunction(resultSelector)) {
        return mergeMap(() => innerObservable, resultSelector, concurrent);
    }
    if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return mergeMap(() => innerObservable, concurrent);
}
//# sourceMappingURL=mergeMapTo.js.map