import { popScheduler } from '../util/args.js';
import { from } from './from.js';
export function of(...args) {
    const scheduler = popScheduler(args);
    return from(args, scheduler);
}
//# sourceMappingURL=of.js.map