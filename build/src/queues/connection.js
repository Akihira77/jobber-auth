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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnection = void 0;
const config_1 = require("../config");
const amqplib_1 = __importDefault(require("amqplib"));
function createConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connection = yield amqplib_1.default.connect(`${config_1.RABBITMQ_ENDPOINT}`);
            const channel = yield connection.createChannel();
            (0, config_1.logger)("queues/connection.ts - createConnection()").info("AuthService connected to RabbitMQ successfully...");
            closeConnection(channel, connection);
            return channel;
        }
        catch (error) {
            (0, config_1.logger)("queues/connection.ts - createConnection()").error("AuthService createConnection() method error:", error);
            process.exit(1);
        }
    });
}
exports.createConnection = createConnection;
function closeConnection(channel, connection) {
    process.once("SIGINT", () => __awaiter(this, void 0, void 0, function* () {
        yield channel.close();
        yield connection.close();
    }));
}
//# sourceMappingURL=connection.js.map