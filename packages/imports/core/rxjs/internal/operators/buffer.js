import { operate } from '../util/lift.js';
import { noop } from '../util/noop.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
import { innerFrom } from '../observable/innerFrom.js';
export function buffer(closingNotifier) {
    return operate((source, subscriber) => {
        let currentBuffer = [];
        source.subscribe(createOperatorSubscriber(subscriber, (value) => currentBuffer.push(value), () => {
            subscriber.next(currentBuffer);
            subscriber.complete();
        }));
        innerFrom(closingNotifier).subscribe(createOperatorSubscriber(subscriber, () => {
            const b = currentBuffer;
            currentBuffer = [];
            subscriber.next(b);
        }, noop));
        return () => {
            currentBuffer = null;
        };
    });
}
//# sourceMappingURL=buffer.js.map