import { Notification } from '../Notification.js';
import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function materialize() {
    return operate((source, subscriber) => {
        source.subscribe(createOperatorSubscriber(subscriber, (value) => {
            subscriber.next(Notification.createNext(value));
        }, () => {
            subscriber.next(Notification.createComplete());
            subscriber.complete();
        }, (err) => {
            subscriber.next(Notification.createError(err));
            subscriber.complete();
        }));
    });
}
//# sourceMappingURL=materialize.js.map