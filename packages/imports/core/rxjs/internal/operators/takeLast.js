import { EMPTY } from '../observable/empty.js';
import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function takeLast(count) {
    return count <= 0
        ? () => EMPTY
        : operate((source, subscriber) => {
            let buffer = [];
            source.subscribe(createOperatorSubscriber(subscriber, (value) => {
                buffer.push(value);
                count < buffer.length && buffer.shift();
            }, () => {
                for (const value of buffer) {
                    subscriber.next(value);
                }
                subscriber.complete();
            }, undefined, () => {
                buffer = null;
            }));
        });
}
//# sourceMappingURL=takeLast.js.map