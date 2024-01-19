import {
    changePassword,
    resetPassword,
    sendForgotPasswordLinkToEmailUser
} from "@auth/controllers/password";
import { signIn } from "@auth/controllers/signIn";
import { signUp } from "@auth/controllers/signUp";
import { verifyEmail } from "@auth/controllers/verifyEmail";
import express, { Router } from "express";

const router: Router = express.Router();

export function authRoutes(): Router {
    router.post("/signup", signUp);
    router.post("/signin", signIn);
    router.put("/verify-email", verifyEmail);
    router.put("/forgot-password", sendForgotPasswordLinkToEmailUser);
    router.put("/reset-password/:token", resetPassword);
    router.put("/change-password", changePassword);

    return router;
}
