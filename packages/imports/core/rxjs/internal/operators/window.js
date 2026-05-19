import { Subject } from '../Subject.js';
import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
import { noop } from '../util/noop.js';
import { innerFrom } from '../observable/innerFrom.js';
export function window(windowBoundaries) {
    return operate((source, subscriber) => {
        let windowSubject = new Subject();
        subscriber.next(windowSubject.asObservable());
        const errorHandler = (err) => {
            windowSubject.error(err);
            subscriber.error(err);
        };
        source.subscribe(createOperatorSubscriber(subscriber, (value) => windowSubject === null || windowSubject === void 0 ? void 0 : windowSubject.next(value), () => {
            windowSubject.complete();
            subscriber.complete();
        }, errorHandler));
        innerFrom(windowBoundaries).subscribe(createOperatorSubscriber(subscriber, () => {
            windowSubject.complete();
            subscriber.next((windowSubject = new Subject()));
        }, noop, errorHandler));
        return () => {
            windowSubject === null || windowSubject === void 0 ? void 0 : windowSubject.unsubscribe();
            windowSubject = null;
        };
    });
}
//# sourceMappingURL=window.js.map