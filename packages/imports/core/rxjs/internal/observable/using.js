import { Observable } from '../Observable.js';
import { innerFrom } from './innerFrom.js';
import { EMPTY } from './empty.js';
export function using(resourceFactory, observableFactory) {
    return new Observable((subscriber) => {
        const resource = resourceFactory();
        const result = observableFactory(resource);
        const source = result ? innerFrom(result) : EMPTY;
        source.subscribe(subscriber);
        return () => {
            if (resource) {
                resource.unsubscribe();
            }
        };
    });
}
//# sourceMappingURL=using.js.map