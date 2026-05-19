import { Subject } from '../Subject.js';
import { innerFrom } from '../observable/innerFrom.js';
import { operate } from '../util/lift.js';
import { fromSubscribable } from '../observable/fromSubscribable.js';
const DEFAULT_CONFIG = {
    connector: () => new Subject(),
};
export function connect(selector, config = DEFAULT_CONFIG) {
    const { connector } = config;
    return operate((source, subscriber) => {
        const subject = connector();
        innerFrom(selector(fromSubscribable(subject))).subscribe(subscriber);
        subscriber.add(source.subscribe(subject));
    });
}
//# sourceMappingURL=connect.js.map