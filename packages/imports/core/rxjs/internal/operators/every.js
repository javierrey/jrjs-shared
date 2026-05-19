import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function every(predicate, thisArg) {
    return operate((source, subscriber) => {
        let index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, (value) => {
            if (!predicate.call(thisArg, value, index++, source)) {
                subscriber.next(false);
                subscriber.complete();
            }
        }, () => {
            subscriber.next(true);
            subscriber.complete();
        }));
    });
}
//# sourceMappingURL=every.js.map