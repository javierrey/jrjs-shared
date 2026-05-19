import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
import { innerFrom } from '../observable/innerFrom.js';
import { noop } from '../util/noop.js';
export function takeUntil(notifier) {
    return operate((source, subscriber) => {
        innerFrom(notifier).subscribe(createOperatorSubscriber(subscriber, () => subscriber.complete(), noop));
        !subscriber.closed && source.subscribe(subscriber);
    });
}
//# sourceMappingURL=takeUntil.js.map