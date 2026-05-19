import { innerFrom } from '../observable/innerFrom.js';
import { Subject } from '../Subject.js';
import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function retryWhen(notifier) {
    return operate((source, subscriber) => {
        let innerSub;
        let syncResub = false;
        let errors$;
        const subscribeForRetryWhen = () => {
            innerSub = source.subscribe(createOperatorSubscriber(subscriber, undefined, undefined, (err) => {
                if (!errors$) {
                    errors$ = new Subject();
                    innerFrom(notifier(errors$)).subscribe(createOperatorSubscriber(subscriber, () => innerSub ? subscribeForRetryWhen() : (syncResub = true)));
                }
                if (errors$) {
                    errors$.next(err);
                }
            }));
            if (syncResub) {
                innerSub.unsubscribe();
                innerSub = null;
                syncResub = false;
                subscribeForRetryWhen();
            }
        };
        subscribeForRetryWhen();
    });
}
//# sourceMappingURL=retryWhen.js.map