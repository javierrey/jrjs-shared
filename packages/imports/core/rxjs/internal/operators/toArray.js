import { reduce } from './reduce.js';
import { operate } from '../util/lift.js';
const arrReducer = (arr, value) => (arr.push(value), arr);
export function toArray() {
    return operate((source, subscriber) => {
        reduce(arrReducer, [])(source).subscribe(subscriber);
    });
}
//# sourceMappingURL=toArray.js.map