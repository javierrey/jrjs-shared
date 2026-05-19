import { __asyncValues, __awaiter } from '../../_deps/tslib/index.js';
import { isArrayLike } from '../util/isArrayLike.js';
import { isPromise } from '../util/isPromise.js';
import { Observable } from '../Observable.js';
import { isInteropObservable } from '../util/isInteropObservable.js';
import { isAsyncIterable } from '../util/isAsyncIterable.js';
import { createInvalidObservableTypeError } from '../util/throwUnobservableError.js';
import { isIterable } from '../util/isIterable.js';
import { isReadableStreamLike, readableStreamLikeToAsyncGenerator } from '../util/isReadableStreamLike.js';
import { isFunction } from '../util/isFunction.js';
import { reportUnhandledError } from '../util/reportUnhandledError.js';
import { observable as Symbol_observable } from '../symbol/observable.js';
export function innerFrom(input) {
    if (input instanceof Observable) {
        return input;
    }
    if (input != null) {
        if (isInteropObservable(input)) {
            return fromInteropObservable(input);
        }
        if (isArrayLike(input)) {
            return fromArrayLike(input);
        }
        if (isPromise(input)) {
            return fromPromise(input);
        }
        if (isAsyncIterable(input)) {
            return fromAsyncIterable(input);
        }
        if (isIterable(input)) {
            return fromIterable(input);
        }
        if (isReadableStreamLike(input)) {
            return fromReadableStreamLike(input);
        }
    }
    throw createInvalidObservableTypeError(input);
}
export function fromInteropObservable(obj) {
    return new Observable((subscriber) => {
        const obs = obj[Symbol_observable]();
        if (isFunction(obs.subscribe)) {
            return obs.subscribe(subscriber);
        }
        throw new TypeError('Provided object does not correctly implement Symbol.observable');
    });
}
export function fromArrayLike(array) {
    return new Observable((subscriber) => {
        for (let i = 0; i < array.length && !subscriber.closed; i++) {
            subscriber.next(array[i]);
        }
        subscriber.complete();
    });
}
export function fromPromise(promise) {
    return new Observable((subscriber) => {
        promise
            .then((value) => {
            if (!subscriber.closed) {
                subscriber.next(value);
                subscriber.complete();
            }
        }, (err) => subscriber.error(err))
            .then(null, reportUnhandledError);
    });
}
export function fromIterable(iterable) {
    return new Observable((subscriber) => {
        for (const value of iterable) {
            subscriber.next(value);
            if (subscriber.closed) {
                return;
            }
        }
        subscriber.complete();
    });
}
export function fromAsyncIterable(asyncIterable) {
    return new Observable((subscriber) => {
        process(asyncIterable, subscriber).catch((err) => subscriber.error(err));
    });
}
export function fromReadableStreamLike(readableStream) {
    return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
}
function process(asyncIterable, subscriber) {
    var asyncIterable_1, asyncIterable_1_1;
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (asyncIterable_1 = __asyncValues(asyncIterable); asyncIterable_1_1 = yield asyncIterable_1.next(), !asyncIterable_1_1.done;) {
                const value = asyncIterable_1_1.value;
                subscriber.next(value);
                if (subscriber.closed) {
                    return;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return)) yield _a.call(asyncIterable_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        subscriber.complete();
    });
}
//# sourceMappingURL=innerFrom.js.map