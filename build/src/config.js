"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.buyerServiceExchangeNamesAndRoutingKeys = exports.notificationServiceExchangeNamesAndRoutingKeys = exports.cloudinaryConfig = exports.ENABLE_APM = exports.ELASTIC_APM_SERVICE_NAME = exports.ELASTIC_APM_SERVER_URL = exports.ELASTIC_APM_SECRET_TOKEN = exports.RABBITMQ_ENDPOINT = exports.NODE_ENV = exports.MYSQL_DB = exports.JWT_TOKEN = exports.API_GATEWAY_URL = exports.GATEWAY_JWT_TOKEN = exports.ELASTIC_SEARCH_URL = exports.CLOUD_NAME = exports.CLOUD_API_SECRET = exports.CLOUD_API_KEY = exports.CLIENT_URL = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
if (process.env.NODE_ENV !== "production") {
    dotenv_1.default.config({ path: "./.env" });
}
else {
    dotenv_1.default.config();
}
_a = process.env, exports.PORT = _a.PORT, exports.CLIENT_URL = _a.CLIENT_URL, exports.CLOUD_API_KEY = _a.CLOUD_API_KEY, exports.CLOUD_API_SECRET = _a.CLOUD_API_SECRET, exports.CLOUD_NAME = _a.CLOUD_NAME, exports.ELASTIC_SEARCH_URL = _a.ELASTIC_SEARCH_URL, exports.GATEWAY_JWT_TOKEN = _a.GATEWAY_JWT_TOKEN, exports.API_GATEWAY_URL = _a.API_GATEWAY_URL, exports.JWT_TOKEN = _a.JWT_TOKEN, exports.MYSQL_DB = _a.MYSQL_DB, exports.NODE_ENV = _a.NODE_ENV, exports.RABBITMQ_ENDPOINT = _a.RABBITMQ_ENDPOINT, exports.ELASTIC_APM_SECRET_TOKEN = _a.ELASTIC_APM_SECRET_TOKEN, exports.ELASTIC_APM_SERVER_URL = _a.ELASTIC_APM_SERVER_URL, exports.ELASTIC_APM_SERVICE_NAME = _a.ELASTIC_APM_SERVICE_NAME, exports.ENABLE_APM = _a.ENABLE_APM;
// if (NODE_ENV === "production" && ENABLE_APM == "1") {
//     require("elastic-apm-node").start({
//         serviceName: `${ELASTIC_APM_SERVICE_NAME}`,
//         serverUrl: ELASTIC_APM_SERVER_URL,
//         secretToken: ELASTIC_APM_SECRET_TOKEN,
//         enironment: NODE_ENV,
//         active: true,
//         captureBody: "all",
//         errorOnAbortedRequests: true,
//         captureErrorLogStackTraces: "always"
//     });
// }
const cloudinaryConfig = () => cloudinary_1.default.v2.config({
    cloud_name: exports.CLOUD_NAME,
    api_key: exports.CLOUD_API_KEY,
    api_secret: exports.CLOUD_API_SECRET
});
exports.cloudinaryConfig = cloudinaryConfig;
exports.notificationServiceExchangeNamesAndRoutingKeys = {
    email: {
        exchangeName: "jobber-email-notification",
        routingKey: "auth-email"
    },
    order: {
        exchangeName: "jobber-order-notification",
        routingKey: "order-email"
    }
};
exports.buyerServiceExchangeNamesAndRoutingKeys = {
    buyer: {
        exchangeName: "jobber-buyer-update",
        routingKey: "user-buyer"
    }
};
const logger = (moduleName) => (0, jobber_shared_1.winstonLogger)(`${exports.ELASTIC_SEARCH_URL}`, moduleName !== null && moduleName !== void 0 ? moduleName : "Auth Service", "debug");
exports.logger = logger;
//# sourceMappingURL=config.js.map