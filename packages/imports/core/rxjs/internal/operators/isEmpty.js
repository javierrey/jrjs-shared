import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function isEmpty() {
    return operate((source, subscriber) => {
        source.subscribe(createOperatorSubscriber(subscriber, () => {
            subscriber.next(false);
            subscriber.complete();
        }, () => {
            subscriber.next(true);
            subscriber.complete();
        }));
    });
}
//# sourceMappingURL=isEmpty.js.map