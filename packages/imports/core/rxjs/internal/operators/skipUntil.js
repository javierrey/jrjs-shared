import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
import { innerFrom } from '../observable/innerFrom.js';
import { noop } from '../util/noop.js';
export function skipUntil(notifier) {
    return operate((source, subscriber) => {
        let taking = false;
        const skipSubscriber = createOperatorSubscriber(subscriber, () => {
            skipSubscriber === null || skipSubscriber === void 0 ? void 0 : skipSubscriber.unsubscribe();
            taking = true;
        }, noop);
        innerFrom(notifier).subscribe(skipSubscriber);
        source.subscribe(createOperatorSubscriber(subscriber, (value) => taking && subscriber.next(value)));
    });
}
//# sourceMappingURL=skipUntil.js.map