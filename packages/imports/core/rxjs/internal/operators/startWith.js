import { concat } from '../observable/concat.js';
import { popScheduler } from '../util/args.js';
import { operate } from '../util/lift.js';
export function startWith(...values) {
    const scheduler = popScheduler(values);
    return operate((source, subscriber) => {
        (scheduler ? concat(values, source, scheduler) : concat(values, source)).subscribe(subscriber);
    });
}
//# sourceMappingURL=startWith.js.map