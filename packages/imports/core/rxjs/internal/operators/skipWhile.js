import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function skipWhile(predicate) {
    return operate((source, subscriber) => {
        let taking = false;
        let index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, (value) => (taking || (taking = !predicate(value, index++))) && subscriber.next(value)));
    });
}
//# sourceMappingURL=skipWhile.js.map