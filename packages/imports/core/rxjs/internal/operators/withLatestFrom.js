import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
import { innerFrom } from '../observable/innerFrom.js';
import { identity } from '../util/identity.js';
import { noop } from '../util/noop.js';
import { popResultSelector } from '../util/args.js';
export function withLatestFrom(...inputs) {
    const project = popResultSelector(inputs);
    return operate((source, subscriber) => {
        const len = inputs.length;
        const otherValues = new Array(len);
        let hasValue = inputs.map(() => false);
        let ready = false;
        for (let i = 0; i < len; i++) {
            innerFrom(inputs[i]).subscribe(createOperatorSubscriber(subscriber, (value) => {
                otherValues[i] = value;
                if (!ready && !hasValue[i]) {
                    hasValue[i] = true;
                    (ready = hasValue.every(identity)) && (hasValue = null);
                }
            }, noop));
        }
        source.subscribe(createOperatorSubscriber(subscriber, (value) => {
            if (ready) {
                const values = [value, ...otherValues];
                subscriber.next(project ? project(...values) : values);
            }
        }));
    });
}
//# sourceMappingURL=withLatestFrom.js.map