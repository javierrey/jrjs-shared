import { zip as zipStatic } from '../observable/zip.js';
import { operate } from '../util/lift.js';
export function zip(...sources) {
    return operate((source, subscriber) => {
        zipStatic(source, ...sources).subscribe(subscriber);
    });
}
//# sourceMappingURL=zip.js.map