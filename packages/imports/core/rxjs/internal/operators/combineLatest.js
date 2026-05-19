import { combineLatestInit } from '../observable/combineLatest.js';
import { operate } from '../util/lift.js';
import { argsOrArgArray } from '../util/argsOrArgArray.js';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs.js';
import { pipe } from '../util/pipe.js';
import { popResultSelector } from '../util/args.js';
export function combineLatest(...args) {
    const resultSelector = popResultSelector(args);
    return resultSelector
        ? pipe(combineLatest(...args), mapOneOrManyArgs(resultSelector))
        : operate((source, subscriber) => {
            combineLatestInit([source, ...argsOrArgArray(args)])(subscriber);
        });
}
//# sourceMappingURL=combineLatest.js.map