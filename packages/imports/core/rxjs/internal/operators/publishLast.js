import { AsyncSubject } from '../AsyncSubject.js';
import { ConnectableObservable } from '../observable/ConnectableObservable.js';
export function publishLast() {
    return (source) => {
        const subject = new AsyncSubject();
        return new ConnectableObservable(source, () => subject);
    };
}
//# sourceMappingURL=publishLast.js.map