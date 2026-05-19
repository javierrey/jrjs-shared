import { operate } from '../util/lift.js';
import { argsOrArgArray } from '../util/argsOrArgArray.js';
import { mergeAll } from './mergeAll.js';
import { popNumber, popScheduler } from '../util/args.js';
import { from } from '../observable/from.js';
export function merge(...args) {
    const scheduler = popScheduler(args);
    const concurrent = popNumber(args, Infinity);
    args = argsOrArgArray(args);
    return operate((source, subscriber) => {
        mergeAll(concurrent)(from([source, ...args], scheduler)).subscribe(subscriber);
    });
}
//# sourceMappingURL=merge.js.map