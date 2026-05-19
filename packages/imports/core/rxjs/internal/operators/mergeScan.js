import { operate } from '../util/lift.js';
import { mergeInternals } from './mergeInternals.js';
export function mergeScan(accumulator, seed, concurrent = Infinity) {
    return operate((source, subscriber) => {
        let state = seed;
        return mergeInternals(source, subscriber, (value, index) => accumulator(state, value, index), concurrent, (value) => {
            state = value;
        }, false, undefined, () => (state = null));
    });
}
//# sourceMappingURL=mergeScan.js.map