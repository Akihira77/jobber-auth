import {
    resendVerificationEmail,
    getCurrentUser
} from "@auth/controllers/currentUser";
import { refreshToken } from "@auth/controllers/refreshToken";
import express, { Router } from "express";

const router: Router = express.Router();

export function userRoutes(): Router {
    router.get("/current-user", getCurrentUser);
    router.get("/refresh-token/:username", refreshToken);
    router.post("/resend-verification-email", resendVerificationEmail);

    return router;
}
