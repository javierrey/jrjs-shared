import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function map(project, thisArg) {
    return operate((source, subscriber) => {
        let index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, (value) => {
            subscriber.next(project.call(thisArg, value, index++));
        }));
    });
}
//# sourceMappingURL=map.js.map