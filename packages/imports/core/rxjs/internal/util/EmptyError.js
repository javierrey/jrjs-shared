import { createErrorClass } from './createErrorClass.js';
export const EmptyError = createErrorClass((_super) => function EmptyErrorImpl() {
    _super(this);
    this.name = 'EmptyError';
    this.message = 'no elements in sequence';
});
//# sourceMappingURL=EmptyError.js.map