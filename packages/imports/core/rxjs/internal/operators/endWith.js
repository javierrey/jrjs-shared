import { concat } from '../observable/concat.js';
import { of } from '../observable/of.js';
export function endWith(...values) {
    return (source) => concat(source, of(...values));
}
//# sourceMappingURL=endWith.js.map