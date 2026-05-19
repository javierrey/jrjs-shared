import { executeSchedule } from '../util/executeSchedule.js';
import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function observeOn(scheduler, delay = 0) {
    return operate((source, subscriber) => {
        source.subscribe(createOperatorSubscriber(subscriber, (value) => executeSchedule(subscriber, scheduler, () => subscriber.next(value), delay), () => executeSchedule(subscriber, scheduler, () => subscriber.complete(), delay), (err) => executeSchedule(subscriber, scheduler, () => subscriber.error(err), delay)));
    });
}
//# sourceMappingURL=observeOn.js.map