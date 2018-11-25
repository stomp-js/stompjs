"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var frame_1 = require("./frame");
/**
 * Instance of Message will be passed to [subscription callback]{@link Client#subscribe}
 * and [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
 * Since it is an extended {@link Frame}, you can access [headers]{@link Frame#headers}
 * and [body]{@link Frame#body} as properties.
 *
 * Part of `@stomp/stompjs`.
 *
 * See [Client#subscribe]{@link Client#subscribe} for example.
 */
var Message = /** @class */ (function (_super) {
    __extends(Message, _super);
    function Message() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Message;
}(frame_1.Frame));
exports.Message = Message;
//# sourceMappingURL=message.js.map