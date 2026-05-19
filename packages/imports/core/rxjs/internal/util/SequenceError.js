import { createErrorClass } from './createErrorClass.js';
export const SequenceError = createErrorClass((_super) => function SequenceErrorImpl(message) {
    _super(this);
    this.name = 'SequenceError';
    this.message = message;
});
//# sourceMappingURL=SequenceError.js.map