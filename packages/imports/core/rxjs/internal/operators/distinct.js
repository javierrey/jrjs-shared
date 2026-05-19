import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
import { noop } from '../util/noop.js';
import { innerFrom } from '../observable/innerFrom.js';
export function distinct(keySelector, flushes) {
    return operate((source, subscriber) => {
        const distinctKeys = new Set();
        source.subscribe(createOperatorSubscriber(subscriber, (value) => {
            const key = keySelector ? keySelector(value) : value;
            if (!distinctKeys.has(key)) {
                distinctKeys.add(key);
                subscriber.next(value);
            }
        }));
        flushes && innerFrom(flushes).subscribe(createOperatorSubscriber(subscriber, () => distinctKeys.clear(), noop));
    });
}
//# sourceMappingURL=distinct.js.map