import { Observable } from '../Observable.js';
import { isFunction } from '../util/isFunction.js';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs.js';
export function fromEventPattern(addHandler, removeHandler, resultSelector) {
    if (resultSelector) {
        return fromEventPattern(addHandler, removeHandler).pipe(mapOneOrManyArgs(resultSelector));
    }
    return new Observable((subscriber) => {
        const handler = (...e) => subscriber.next(e.length === 1 ? e[0] : e);
        const retValue = addHandler(handler);
        return isFunction(removeHandler) ? () => removeHandler(handler, retValue) : undefined;
    });
}
//# sourceMappingURL=fromEventPattern.js.map