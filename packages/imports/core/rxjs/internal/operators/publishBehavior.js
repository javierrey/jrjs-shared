import { BehaviorSubject } from '../BehaviorSubject.js';
import { ConnectableObservable } from '../observable/ConnectableObservable.js';
export function publishBehavior(initialValue) {
    return (source) => {
        const subject = new BehaviorSubject(initialValue);
        return new ConnectableObservable(source, () => subject);
    };
}
//# sourceMappingURL=publishBehavior.js.map