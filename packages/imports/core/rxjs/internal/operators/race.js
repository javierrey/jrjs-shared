import { argsOrArgArray } from '../util/argsOrArgArray.js';
import { raceWith } from './raceWith.js';
export function race(...args) {
    return raceWith(...argsOrArgArray(args));
}
//# sourceMappingURL=race.js.map