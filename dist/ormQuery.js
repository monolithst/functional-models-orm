"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EQUALITY_SYMBOLS = exports.ormQueryBuilder = void 0;
var merge_1 = __importDefault(require("lodash/merge"));
var interfaces_1 = require("./interfaces");
Object.defineProperty(exports, "EQUALITY_SYMBOLS", { enumerable: true, get: function () { return interfaces_1.EQUALITY_SYMBOLS; } });
var compile = function (queryData) { return function () {
    // TODO: This does not handle AND/OR at all.
    var startingQuery = { properties: {}, chain: queryData };
    return queryData.reduce(function (acc, partial) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (partial.type === 'property') {
            return (0, merge_1.default)(acc, { properties: (_a = {}, _a[partial.name] = partial, _a) });
        }
        else if (partial.type === 'and') {
            return acc;
        }
        else if (partial.type === 'or') {
            return acc;
        }
        else if (partial.type === 'datesAfter') {
            return acc.datesAfter
                ? (0, merge_1.default)(acc, { datesAfter: __assign(__assign({}, acc.datesAfter), (_b = {}, _b[partial.key] = partial, _b)) })
                : (0, merge_1.default)(acc, { datesAfter: (_c = {}, _c[partial.key] = partial, _c) });
        }
        else if (partial.type === 'datesBefore') {
            return acc.datesBefore
                ? (0, merge_1.default)(acc, { datesBefore: __assign(__assign({}, acc.datesBefore), (_d = {}, _d[partial.key] = partial, _d)) })
                : (0, merge_1.default)(acc, { datesBefore: (_e = {}, _e[partial.key] = partial, _e) });
        }
        else if (partial.type === 'sort') {
            return (0, merge_1.default)(acc, (_f = {}, _f[partial.type] = partial, _f));
        }
        return (0, merge_1.default)(acc, (_g = {}, _g[partial.type] = partial.value, _g));
    }, startingQuery);
}; };
var ormQueryBuilder = function (queryData) {
    if (queryData === void 0) { queryData = []; }
    var datesAfter = function (key, jsDate, _a) {
        var _b = _a.valueType, valueType = _b === void 0 ? interfaces_1.ORMType.string : _b, _c = _a.equalToAndAfter, equalToAndAfter = _c === void 0 ? true : _c;
        var datesAfter = {
            type: 'datesAfter',
            key: key,
            date: jsDate,
            valueType: valueType,
            options: {
                equalToAndAfter: equalToAndAfter
            }
        };
        return ormQueryBuilder(__spreadArray(__spreadArray([], queryData, true), [
            datesAfter,
        ], false));
    };
    var datesBefore = function (key, jsDate, _a) {
        var _b = _a.valueType, valueType = _b === void 0 ? interfaces_1.ORMType.string : _b, _c = _a.equalToAndBefore, equalToAndBefore = _c === void 0 ? true : _c;
        return ormQueryBuilder(__spreadArray(__spreadArray([], queryData, true), [
            {
                type: 'datesBefore',
                key: key,
                date: jsDate,
                valueType: valueType,
                options: {
                    equalToAndBefore: equalToAndBefore,
                },
            },
        ], false));
    };
    var property = function (name, value, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.caseSensitive, caseSensitive = _c === void 0 ? false : _c, _d = _b.startsWith, startsWith = _d === void 0 ? false : _d, _e = _b.endsWith, endsWith = _e === void 0 ? false : _e, _f = _b.type, type = _f === void 0 ? interfaces_1.ORMType.string : _f, _g = _b.equalitySymbol, equalitySymbol = _g === void 0 ? interfaces_1.EQUALITY_SYMBOLS.EQUALS : _g;
        if (!interfaces_1.ALLOWABLE_EQUALITY_SYMBOLS.includes(equalitySymbol)) {
            throw new Error("".concat(equalitySymbol, " is not a valid symbol"));
        }
        if (equalitySymbol !== interfaces_1.EQUALITY_SYMBOLS.EQUALS && type === interfaces_1.ORMType.string) {
            throw new Error("Cannot use a non = symbol for a string type");
        }
        if (!type) {
            type = interfaces_1.ORMType.string;
        }
        var propertyEntry = {
            type: 'property',
            name: name,
            value: value,
            valueType: type,
            options: {
                caseSensitive: caseSensitive,
                startsWith: startsWith,
                endsWith: endsWith,
                equalitySymbol: equalitySymbol,
            },
        };
        return ormQueryBuilder(__spreadArray(__spreadArray([], queryData, true), [
            propertyEntry,
        ], false));
    };
    var pagination = function (value) {
        return ormQueryBuilder(__spreadArray(__spreadArray([], queryData, true), [
            {
                type: 'page',
                value: value,
            },
        ], false));
    };
    var take = function (count) {
        var parsed = parseInt(count, 10);
        if (Number.isNaN(parsed)) {
            throw new Error("".concat(count, " must be an integer."));
        }
        return ormQueryBuilder(__spreadArray(__spreadArray([], queryData, true), [
            {
                type: 'take',
                value: parsed,
            },
        ], false));
    };
    var sort = function (key, isAscending) {
        if (isAscending === void 0) { isAscending = true; }
        if (typeof isAscending !== 'boolean') {
            throw new Error('Must be a boolean type');
        }
        return ormQueryBuilder(__spreadArray(__spreadArray([], queryData, true), [
            {
                type: 'sort',
                key: key,
                order: isAscending,
            },
        ], false));
    };
    var and = function () {
        return ormQueryBuilder(__spreadArray(__spreadArray([], queryData, true), [{ type: 'and' }], false));
    };
    var or = function () {
        return ormQueryBuilder(__spreadArray(__spreadArray([], queryData, true), [{ type: 'or' }], false));
    };
    return {
        compile: compile(queryData),
        datesAfter: datesAfter,
        datesBefore: datesBefore,
        property: property,
        pagination: pagination,
        sort: sort,
        take: take,
        and: and,
        or: or,
    };
};
exports.ormQueryBuilder = ormQueryBuilder;
//# sourceMappingURL=ormQuery.js.map