import { ConnectableObservable } from '../observable/ConnectableObservable.js';
import { isFunction } from '../util/isFunction.js';
import { connect } from './connect.js';
export function multicast(subjectOrSubjectFactory, selector) {
    const subjectFactory = isFunction(subjectOrSubjectFactory) ? subjectOrSubjectFactory : () => subjectOrSubjectFactory;
    if (isFunction(selector)) {
        return connect(selector, {
            connector: subjectFactory,
        });
    }
    return (source) => new ConnectableObservable(source, subjectFactory);
}
//# sourceMappingURL=multicast.js.map