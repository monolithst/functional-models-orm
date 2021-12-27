"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var flow_1 = __importDefault(require("lodash/flow"));
var ormQuery_1 = require("./ormQuery");
var _doUniqueCheck = function (query, instance, instanceData, buildErrorMessage) { return __awaiter(void 0, void 0, void 0, function () {
    var model, results, resultsLength, ids, instanceId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                model = instance.meta.getModel();
                return [4 /*yield*/, model.search(query)];
            case 1:
                results = _a.sent();
                resultsLength = results.instances.length;
                // There is nothing stored with this value.
                if (resultsLength < 1) {
                    return [2 /*return*/, undefined];
                }
                return [4 /*yield*/, Promise.all(results.instances.map(function (x) { return x.functions.getPrimaryKey(); }))
                    // We have our match by id.
                ];
            case 2:
                ids = _a.sent();
                instanceId = instanceData[model.getPrimaryKeyName()];
                if (ids.length === 1 && ids[0] === instanceId) {
                    return [2 /*return*/, undefined];
                }
                if (ids.length > 1) {
                    // This is a weird but possible case where there is more than one item. We don't want to error
                    // if the instance we are checking is already in the datastore.
                    if (ids.find(function (x) { return x === instanceId; })) {
                        return [2 /*return*/, undefined];
                    }
                }
                return [2 /*return*/, buildErrorMessage()];
        }
    });
}); };
var uniqueTogether = function (propertyKeyArray) {
    var _uniqueTogether = function (instance, instanceData, options) {
        if (options === void 0) { options = buildOrmValidationOptions({}); }
        return __awaiter(void 0, void 0, void 0, function () {
            var properties, query;
            return __generator(this, function (_a) {
                if (options.noOrmValidation) {
                    return [2 /*return*/, undefined];
                }
                properties = propertyKeyArray.map(function (key) {
                    return [key, instanceData[key]];
                });
                query = (0, flow_1.default)(properties.map(function (_a) {
                    var key = _a[0], value = _a[1];
                    return function (b) {
                        return b.property(key, value, { caseSensitive: false }).and();
                    };
                }))((0, ormQuery_1.ormQueryBuilder)()).compile();
                return [2 /*return*/, _doUniqueCheck(query, instance, instanceData, function () {
                        return propertyKeyArray.length > 1
                            ? "".concat(propertyKeyArray.join(','), " must be unique together. Another instance found.")
                            : "".concat(propertyKeyArray[0], " must be unique. Another instance found.");
                    })];
            });
        });
    };
    return _uniqueTogether;
};
var unique = function (propertyKey) {
    var _unique = function (value, instance, instanceData, options) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, uniqueTogether([propertyKey])(instance, instanceData, options)];
        });
    }); };
    return _unique;
};
var buildOrmValidationOptions = function (_a) {
    var _b = _a.noOrmValidation, noOrmValidation = _b === void 0 ? false : _b;
    return ({
        noOrmValidation: noOrmValidation,
    });
};
module.exports = {
    unique: unique,
    uniqueTogether: uniqueTogether,
    buildOrmValidationOptions: buildOrmValidationOptions,
};
//# sourceMappingURL=validation.js.map