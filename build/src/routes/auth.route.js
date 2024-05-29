"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const currentUser_1 = require("../controllers/currentUser");
const password_1 = require("../controllers/password");
const refreshToken_1 = require("../controllers/refreshToken");
const signIn_1 = require("../controllers/signIn");
const signUp_1 = require("../controllers/signUp");
const verifyEmail_1 = require("../controllers/verifyEmail");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
function authRoutes() {
    router.get("/current-user", currentUser_1.getCurrentUser);
    router.get("/refresh-token/:username", refreshToken_1.getRefreshToken);
    router.post("/resend-verification-email", currentUser_1.resendVerificationEmail);
    router.post("/signup", signUp_1.signUp);
    router.post("/signin", signIn_1.signIn);
    router.put("/verify-email", verifyEmail_1.verifyEmail);
    router.put("/forgot-password", password_1.sendForgotPasswordLinkToEmailUser);
    router.put("/reset-password/:token", password_1.resetPassword);
    router.put("/change-password", password_1.changePassword);
    return router;
}
exports.authRoutes = authRoutes;
//# sourceMappingURL=auth.route.js.map