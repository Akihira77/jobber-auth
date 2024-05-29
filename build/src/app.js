"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const express_1 = __importDefault(require("express"));
const server_1 = require("./server");
const database_1 = require("./database");
function initialize() {
    (0, config_1.cloudinaryConfig)();
    const app = (0, express_1.default)();
    (0, database_1.databaseConnection)();
    (0, server_1.start)(app);
}
initialize();
//# sourceMappingURL=app.js.map