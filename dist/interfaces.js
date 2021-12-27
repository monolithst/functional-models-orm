"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWABLE_EQUALITY_SYMBOLS = exports.ORMType = exports.EQUALITY_SYMBOLS = void 0;
var EQUALITY_SYMBOLS;
(function (EQUALITY_SYMBOLS) {
    EQUALITY_SYMBOLS["EQUALS"] = "=";
    EQUALITY_SYMBOLS["LT"] = "<";
    EQUALITY_SYMBOLS["LTE"] = "<=";
    EQUALITY_SYMBOLS["GT"] = ">";
    EQUALITY_SYMBOLS["GTE"] = ">=";
})(EQUALITY_SYMBOLS || (EQUALITY_SYMBOLS = {}));
exports.EQUALITY_SYMBOLS = EQUALITY_SYMBOLS;
var ALLOWABLE_EQUALITY_SYMBOLS = Object.values(EQUALITY_SYMBOLS);
exports.ALLOWABLE_EQUALITY_SYMBOLS = ALLOWABLE_EQUALITY_SYMBOLS;
var ORMType;
(function (ORMType) {
    ORMType["string"] = "string";
    ORMType["number"] = "number";
    ORMType["date"] = "date";
    ORMType["object"] = "object";
    ORMType["boolean"] = "boolean";
})(ORMType || (ORMType = {}));
exports.ORMType = ORMType;
//# sourceMappingURL=interfaces.js.map