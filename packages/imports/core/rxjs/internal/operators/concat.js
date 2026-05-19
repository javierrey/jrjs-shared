import { operate } from '../util/lift.js';
import { concatAll } from './concatAll.js';
import { popScheduler } from '../util/args.js';
import { from } from '../observable/from.js';
export function concat(...args) {
    const scheduler = popScheduler(args);
    return operate((source, subscriber) => {
        concatAll()(from([source, ...args], scheduler)).subscribe(subscriber);
    });
}
//# sourceMappingURL=concat.js.map