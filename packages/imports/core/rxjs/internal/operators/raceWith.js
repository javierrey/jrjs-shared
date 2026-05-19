import { raceInit } from '../observable/race.js';
import { operate } from '../util/lift.js';
import { identity } from '../util/identity.js';
export function raceWith(...otherSources) {
    return !otherSources.length
        ? identity
        : operate((source, subscriber) => {
            raceInit([source, ...otherSources])(subscriber);
        });
}
//# sourceMappingURL=raceWith.js.map