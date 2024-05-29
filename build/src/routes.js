"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRoutes = void 0;
const auth_route_1 = require("./routes/auth.route");
const health_route_1 = require("./routes/health.route");
const search_route_1 = require("./routes/search.route");
const seed_route_1 = require("./routes/seed.route");
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const BASE_PATH = "/api/v1/auth";
function appRoutes(app) {
    app.use("", (0, health_route_1.healthRoutes)());
    app.use(BASE_PATH, (0, seed_route_1.seedRoutes)());
    app.use(BASE_PATH, (0, search_route_1.searchRoutes)());
    app.use(BASE_PATH, jobber_shared_1.verifyGatewayRequest, (0, auth_route_1.authRoutes)());
}
exports.appRoutes = appRoutes;
//# sourceMappingURL=routes.js.map