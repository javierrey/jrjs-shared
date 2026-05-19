import { concatMap } from './concatMap.js';
import { isFunction } from '../util/isFunction.js';
export function concatMapTo(innerObservable, resultSelector) {
    return isFunction(resultSelector) ? concatMap(() => innerObservable, resultSelector) : concatMap(() => innerObservable);
}
//# sourceMappingURL=concatMapTo.js.map