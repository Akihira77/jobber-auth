import { Application } from "express";
import { authRoutes } from "@auth/routes/auth.route";
import { healthRoutes } from "@auth/routes/health.route";
import { searchRoutes } from "@auth/routes/search.route";
import { seedRoutes } from "@auth/routes/seed.route";
import { verifyGatewayRequest } from "@Akihira77/jobber-shared";

const BASE_PATH = "/api/v1/auth";

export function appRoutes(app: Application): void {
    app.use("", healthRoutes());
    app.use(BASE_PATH, seedRoutes());
    app.use(BASE_PATH, searchRoutes());

    app.use(BASE_PATH, verifyGatewayRequest, authRoutes());
}
