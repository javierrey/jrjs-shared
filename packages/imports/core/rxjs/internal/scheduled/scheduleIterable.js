import { Observable } from '../Observable.js';
import { iterator as Symbol_iterator } from '../symbol/iterator.js';
import { isFunction } from '../util/isFunction.js';
import { executeSchedule } from '../util/executeSchedule.js';
export function scheduleIterable(input, scheduler) {
    return new Observable((subscriber) => {
        let iterator;
        executeSchedule(subscriber, scheduler, () => {
            iterator = input[Symbol_iterator]();
            executeSchedule(subscriber, scheduler, () => {
                let value;
                let done;
                try {
                    ({ value, done } = iterator.next());
                }
                catch (err) {
                    subscriber.error(err);
                    return;
                }
                if (done) {
                    subscriber.complete();
                }
                else {
                    subscriber.next(value);
                }
            }, 0, true);
        });
        return () => isFunction(iterator === null || iterator === void 0 ? void 0 : iterator.return) && iterator.return();
    });
}
//# sourceMappingURL=scheduleIterable.js.map