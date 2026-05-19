import { observeNotification } from '../Notification.js';
import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function dematerialize() {
    return operate((source, subscriber) => {
        source.subscribe(createOperatorSubscriber(subscriber, (notification) => observeNotification(notification, subscriber)));
    });
}
//# sourceMappingURL=dematerialize.js.map