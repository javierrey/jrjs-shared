import { Subject } from '../Subject.js';
import { multicast } from './multicast.js';
import { connect } from './connect.js';
export function publish(selector) {
    return selector ? (source) => connect(selector)(source) : (source) => multicast(new Subject())(source);
}
//# sourceMappingURL=publish.js.map