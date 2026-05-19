import { map } from './map.js';
import { innerFrom } from '../observable/innerFrom.js';
import { operate } from '../util/lift.js';
import { createOperatorSubscriber } from './OperatorSubscriber.js';
export function exhaustMap(project, resultSelector) {
    if (resultSelector) {
        return (source) => source.pipe(exhaustMap((a, i) => innerFrom(project(a, i)).pipe(map((b, ii) => resultSelector(a, b, i, ii)))));
    }
    return operate((source, subscriber) => {
        let index = 0;
        let innerSub = null;
        let isComplete = false;
        source.subscribe(createOperatorSubscriber(subscriber, (outerValue) => {
            if (!innerSub) {
                innerSub = createOperatorSubscriber(subscriber, undefined, () => {
                    innerSub = null;
                    isComplete && subscriber.complete();
                });
                innerFrom(project(outerValue, index++)).subscribe(innerSub);
            }
        }, () => {
            isComplete = true;
            !innerSub && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=exhaustMap.js.map