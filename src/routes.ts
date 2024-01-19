import { Application } from "express";
import { authRoutes } from "@auth/routes/auth.route";
import { verifyGatewayRequest } from "@Akihira77/jobber-shared";
import { userRoutes } from "@auth/routes/user.route";
import { healthRoutes } from "@auth/routes/health.route";

const BASE_PATH = "/api/v1/auth";

export function appRoutes(app: Application): void {
    app.use("", healthRoutes);

    app.use(BASE_PATH, verifyGatewayRequest, authRoutes());
    app.use(BASE_PATH, verifyGatewayRequest, userRoutes());
}
