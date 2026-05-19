import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function filter(predicate, thisArg) {
    return operate((source, subscriber) => {
        let index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, (value) => predicate.call(thisArg, value, index++) && subscriber.next(value)));
    });
}
//# sourceMappingURL=filter.js.map