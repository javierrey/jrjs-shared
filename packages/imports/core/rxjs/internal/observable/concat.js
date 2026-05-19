import { concatAll } from '../operators/concatAll.js';
import { popScheduler } from '../util/args.js';
import { from } from './from.js';
export function concat(...args) {
    return concatAll()(from(args, popScheduler(args)));
}
//# sourceMappingURL=concat.js.map