import { switchMap } from './switchMap.js';
import { operate } from '../util/lift.js';
export function switchScan(accumulator, seed) {
    return operate((source, subscriber) => {
        let state = seed;
        switchMap((value, index) => accumulator(state, value, index), (_, innerValue) => ((state = innerValue), innerValue))(source).subscribe(subscriber);
        return () => {
            state = null;
        };
    });
}
//# sourceMappingURL=switchScan.js.map