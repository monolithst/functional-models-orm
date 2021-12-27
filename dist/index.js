"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.properties = exports.validation = exports.datastore = exports.ormQuery = exports.orm = exports.interfaces = void 0;
var orm_1 = __importDefault(require("./orm"));
exports.orm = orm_1.default;
var ormQuery = __importStar(require("./ormQuery"));
exports.ormQuery = ormQuery;
var datastore = __importStar(require("./datastore"));
exports.datastore = datastore;
var validation = __importStar(require("./validation"));
exports.validation = validation;
var properties = __importStar(require("./properties"));
exports.properties = properties;
var interfaces = __importStar(require("./interfaces"));
exports.interfaces = interfaces;
//# sourceMappingURL=index.js.map