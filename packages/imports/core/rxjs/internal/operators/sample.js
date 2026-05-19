import { innerFrom } from '../observable/innerFrom.js';
import { operate } from '../util/lift.js';
import { noop } from '../util/noop.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function sample(notifier) {
    return operate((source, subscriber) => {
        let hasValue = false;
        let lastValue = null;
        source.subscribe(createOperatorSubscriber(subscriber, (value) => {
            hasValue = true;
            lastValue = value;
        }));
        innerFrom(notifier).subscribe(createOperatorSubscriber(subscriber, () => {
            if (hasValue) {
                hasValue = false;
                const value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
        }, noop));
    });
}
//# sourceMappingURL=sample.js.map