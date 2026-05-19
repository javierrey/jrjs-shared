import { Observable } from '../Observable.js';
import { argsArgArrayOrObject } from '../util/argsArgArrayOrObject.js';
import { from } from './from.js';
import { identity } from '../util/identity.js';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs.js';
import { popResultSelector, popScheduler } from '../util/args.js';
import { createObject } from '../util/createObject.js';
import { createOperatorSubscriber } from '../operators/OperatorSubscriber.js';
import { executeSchedule } from '../util/executeSchedule.js';
export function combineLatest(...args) {
    const scheduler = popScheduler(args);
    const resultSelector = popResultSelector(args);
    const { args: observables, keys } = argsArgArrayOrObject(args);
    if (observables.length === 0) {
        return from([], scheduler);
    }
    const result = new Observable(combineLatestInit(observables, scheduler, keys
        ?
            (values) => createObject(keys, values)
        :
            identity));
    return resultSelector ? result.pipe(mapOneOrManyArgs(resultSelector)) : result;
}
export function combineLatestInit(observables, scheduler, valueTransform = identity) {
    return (subscriber) => {
        maybeSchedule(scheduler, () => {
            const { length } = observables;
            const values = new Array(length);
            let active = length;
            let remainingFirstValues = length;
            for (let i = 0; i < length; i++) {
                maybeSchedule(scheduler, () => {
                    const source = from(observables[i], scheduler);
                    let hasFirstValue = false;
                    source.subscribe(createOperatorSubscriber(subscriber, (value) => {
                        values[i] = value;
                        if (!hasFirstValue) {
                            hasFirstValue = true;
                            remainingFirstValues--;
                        }
                        if (!remainingFirstValues) {
                            subscriber.next(valueTransform(values.slice()));
                        }
                    }, () => {
                        if (!--active) {
                            subscriber.complete();
                        }
                    }));
                }, subscriber);
            }
        }, subscriber);
    };
}
function maybeSchedule(scheduler, execute, subscription) {
    if (scheduler) {
        executeSchedule(subscription, scheduler, execute);
    }
    else {
        execute();
    }
}
//# sourceMappingURL=combineLatest.js.map