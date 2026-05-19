import { Subject } from '../Subject.js';
import { Subscription } from '../Subscription.js';
import { operate } from '../util/lift.js';
import { innerFrom } from '../observable/innerFrom.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
import { noop } from '../util/noop.js';
import { arrRemove } from '../util/arrRemove.js';
export function windowToggle(openings, closingSelector) {
    return operate((source, subscriber) => {
        const windows = [];
        const handleError = (err) => {
            while (0 < windows.length) {
                windows.shift().error(err);
            }
            subscriber.error(err);
        };
        innerFrom(openings).subscribe(createOperatorSubscriber(subscriber, (openValue) => {
            const window = new Subject();
            windows.push(window);
            const closingSubscription = new Subscription();
            const closeWindow = () => {
                arrRemove(windows, window);
                window.complete();
                closingSubscription.unsubscribe();
            };
            let closingNotifier;
            try {
                closingNotifier = innerFrom(closingSelector(openValue));
            }
            catch (err) {
                handleError(err);
                return;
            }
            subscriber.next(window.asObservable());
            closingSubscription.add(closingNotifier.subscribe(createOperatorSubscriber(subscriber, closeWindow, noop, handleError)));
        }, noop));
        source.subscribe(createOperatorSubscriber(subscriber, (value) => {
            const windowsCopy = windows.slice();
            for (const window of windowsCopy) {
                window.next(value);
            }
        }, () => {
            while (0 < windows.length) {
                windows.shift().complete();
            }
            subscriber.complete();
        }, handleError, () => {
            while (0 < windows.length) {
                windows.shift().unsubscribe();
            }
        }));
    });
}
//# sourceMappingURL=windowToggle.js.map