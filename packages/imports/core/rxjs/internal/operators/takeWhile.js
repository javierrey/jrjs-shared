import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function takeWhile(predicate, inclusive = false) {
    return operate((source, subscriber) => {
        let index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, (value) => {
            const result = predicate(value, index++);
            (result || inclusive) && subscriber.next(value);
            !result && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=takeWhile.js.map