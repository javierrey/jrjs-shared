import { Observable } from '../Observable.js';
import { innerFrom } from './innerFrom.js';
import { argsOrArgArray } from '../util/argsOrArgArray.js';
import { EMPTY } from './empty.js';
import { createOperatorSubscriber } from '../operators/OperatorSubscriber.js';
import { popResultSelector } from '../util/args.js';
export function zip(...args) {
    const resultSelector = popResultSelector(args);
    const sources = argsOrArgArray(args);
    return sources.length
        ? new Observable((subscriber) => {
            let buffers = sources.map(() => []);
            let completed = sources.map(() => false);
            subscriber.add(() => {
                buffers = completed = null;
            });
            for (let sourceIndex = 0; !subscriber.closed && sourceIndex < sources.length; sourceIndex++) {
                innerFrom(sources[sourceIndex]).subscribe(createOperatorSubscriber(subscriber, (value) => {
                    buffers[sourceIndex].push(value);
                    if (buffers.every((buffer) => buffer.length)) {
                        const result = buffers.map((buffer) => buffer.shift());
                        subscriber.next(resultSelector ? resultSelector(...result) : result);
                        if (buffers.some((buffer, i) => !buffer.length && completed[i])) {
                            subscriber.complete();
                        }
                    }
                }, () => {
                    completed[sourceIndex] = true;
                    !buffers[sourceIndex].length && subscriber.complete();
                }));
            }
            return () => {
                buffers = completed = null;
            };
        })
        : EMPTY;
}
//# sourceMappingURL=zip.js.map