import { Observable } from '../Observable.js';
import { argsArgArrayOrObject } from '../util/argsArgArrayOrObject.js';
import { innerFrom } from './innerFrom.js';
import { popResultSelector } from '../util/args.js';
import { createOperatorSubscriber } from '../operators/OperatorSubscriber.js';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs.js';
import { createObject } from '../util/createObject.js';
export function forkJoin(...args) {
    const resultSelector = popResultSelector(args);
    const { args: sources, keys } = argsArgArrayOrObject(args);
    const result = new Observable((subscriber) => {
        const { length } = sources;
        if (!length) {
            subscriber.complete();
            return;
        }
        const values = new Array(length);
        let remainingCompletions = length;
        let remainingEmissions = length;
        for (let sourceIndex = 0; sourceIndex < length; sourceIndex++) {
            let hasValue = false;
            innerFrom(sources[sourceIndex]).subscribe(createOperatorSubscriber(subscriber, (value) => {
                if (!hasValue) {
                    hasValue = true;
                    remainingEmissions--;
                }
                values[sourceIndex] = value;
            }, () => remainingCompletions--, undefined, () => {
                if (!remainingCompletions || !hasValue) {
                    if (!remainingEmissions) {
                        subscriber.next(keys ? createObject(keys, values) : values);
                    }
                    subscriber.complete();
                }
            }));
        }
    });
    return resultSelector ? result.pipe(mapOneOrManyArgs(resultSelector)) : result;
}
//# sourceMappingURL=forkJoin.js.map