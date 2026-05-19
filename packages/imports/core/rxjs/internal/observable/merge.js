import { mergeAll } from '../operators/mergeAll.js';
import { innerFrom } from './innerFrom.js';
import { EMPTY } from './empty.js';
import { popNumber, popScheduler } from '../util/args.js';
import { from } from './from.js';
export function merge(...args) {
    const scheduler = popScheduler(args);
    const concurrent = popNumber(args, Infinity);
    const sources = args;
    return !sources.length
        ?
            EMPTY
        : sources.length === 1
            ?
                innerFrom(sources[0])
            :
                mergeAll(concurrent)(from(sources, scheduler));
}
//# sourceMappingURL=merge.js.map