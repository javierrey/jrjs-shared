import { Subscription } from '../Subscription.js';
import { operate } from '../util/lift.js';
import { innerFrom } from '../observable/innerFrom.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
import { noop } from '../util/noop.js';
import { arrRemove } from '../util/arrRemove.js';
export function bufferToggle(openings, closingSelector) {
    return operate((source, subscriber) => {
        const buffers = [];
        innerFrom(openings).subscribe(createOperatorSubscriber(subscriber, (openValue) => {
            const buffer = [];
            buffers.push(buffer);
            const closingSubscription = new Subscription();
            const emitBuffer = () => {
                arrRemove(buffers, buffer);
                subscriber.next(buffer);
                closingSubscription.unsubscribe();
            };
            closingSubscription.add(innerFrom(closingSelector(openValue)).subscribe(createOperatorSubscriber(subscriber, emitBuffer, noop)));
        }, noop));
        source.subscribe(createOperatorSubscriber(subscriber, (value) => {
            for (const buffer of buffers) {
                buffer.push(value);
            }
        }, () => {
            while (buffers.length > 0) {
                subscriber.next(buffers.shift());
            }
            subscriber.complete();
        }));
    });
}
//# sourceMappingURL=bufferToggle.js.map