import { switchMap } from './switchMap.js';
import { isFunction } from '../util/isFunction.js';
export function switchMapTo(innerObservable, resultSelector) {
    return isFunction(resultSelector) ? switchMap(() => innerObservable, resultSelector) : switchMap(() => innerObservable);
}
//# sourceMappingURL=switchMapTo.js.map