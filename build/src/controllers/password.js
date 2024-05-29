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
exports.changePassword = exports.resetPassword = exports.sendForgotPasswordLinkToEmailUser = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const password_1 = require("../schemas/password");
const auth_service_1 = require("../services/auth.service");
const config_1 = require("../config");
const auth_producer_1 = require("../queues/auth.producer");
const server_1 = require("../server");
const http_status_codes_1 = require("http-status-codes");
const auth_model_1 = require("../models/auth.model");
function sendForgotPasswordLinkToEmailUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = password_1.emailSchema.validate(req.body);
        if (error === null || error === void 0 ? void 0 : error.details) {
            throw new jobber_shared_1.BadRequestError(error.details[0].message, "Password sendForgotPasswordLinkToEmailUser() method error");
        }
        const { email } = req.body;
        const existingUser = yield (0, auth_service_1.getUserByEmail)(email);
        if (!existingUser) {
            throw new jobber_shared_1.NotFoundError("Invalid credentials", "Password sendForgotPasswordLinkToEmailUser() method error");
        }
        const randomBytes = yield Promise.resolve(crypto_1.default.randomBytes(20));
        const randomCharacters = randomBytes.toString("hex");
        const date = new Date();
        date.setHours(date.getHours() + 1);
        yield (0, auth_service_1.updatePasswordToken)(existingUser.id, randomCharacters, date);
        // publish to 2-notification-service > consumeAuthEmailMessages
        const resetLink = `${config_1.CLIENT_URL}/reset_password?token=${randomCharacters}`;
        const messageDetails = {
            receiverEmail: existingUser.email,
            resetLink,
            username: existingUser.username,
            template: "forgotPassword"
        };
        const { exchangeName, routingKey } = config_1.notificationServiceExchangeNamesAndRoutingKeys.email;
        (0, auth_producer_1.publishDirectMessage)(server_1.authChannel, exchangeName, routingKey, JSON.stringify(messageDetails), "Forgot password message has been sent to notification service.");
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Password reset password has been sent."
        });
    });
}
exports.sendForgotPasswordLinkToEmailUser = sendForgotPasswordLinkToEmailUser;
function resetPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = password_1.resetPasswordSchema.validate(req.body);
        if (error === null || error === void 0 ? void 0 : error.details) {
            throw new jobber_shared_1.BadRequestError(error.details[0].message, "Password resetPassword() method error");
        }
        const { password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            throw new jobber_shared_1.BadRequestError("Passwords not match", "Password resetPassword() method error");
        }
        const { token } = req.params;
        const existingUser = yield (0, auth_service_1.getAuthUserByPasswordToken)(token);
        if (!existingUser) {
            throw new jobber_shared_1.NotFoundError("Reset token has expired.", "Password resetPassword() method error");
        }
        const hashedPassword = yield auth_model_1.AuthModel.prototype.hashPassword(password);
        yield (0, auth_service_1.updatePassword)(existingUser.id, hashedPassword);
        // publish to 2-notification-service > consumeAuthEmailMessages
        const messageDetails = {
            username: existingUser.username,
            receiverEmail: existingUser.email,
            template: "resetPasswordSuccess"
        };
        const { exchangeName, routingKey } = config_1.notificationServiceExchangeNamesAndRoutingKeys.email;
        (0, auth_producer_1.publishDirectMessage)(server_1.authChannel, exchangeName, routingKey, JSON.stringify(messageDetails), "Reset password success message has been sent to notification service.");
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Password successfully updated."
        });
    });
}
exports.resetPassword = resetPassword;
function changePassword(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = password_1.changePasswordSchema.validate(req.body);
        if (error === null || error === void 0 ? void 0 : error.details) {
            throw new jobber_shared_1.BadRequestError(error.details[0].message, "Password changePassword() method error");
        }
        const { currentPassword, newPassword } = req.body;
        const existingUser = yield (0, auth_service_1.getUserByUsername)(req.currentUser.username);
        if (!existingUser) {
            throw new jobber_shared_1.NotFoundError("User is not found", "Password changePassword() method error");
        }
        const isValidPassword = yield auth_model_1.AuthModel.prototype.comparePassword(currentPassword, (_a = existingUser.password) !== null && _a !== void 0 ? _a : "");
        if (!isValidPassword) {
            throw new jobber_shared_1.BadRequestError("Invalid password.", "Password changePassword() method error");
        }
        const hashedPassword = yield auth_model_1.AuthModel.prototype.hashPassword(newPassword);
        yield (0, auth_service_1.updatePassword)(existingUser.id, hashedPassword);
        // publish to 2-notification-service > consumeAuthEmailMessages
        const messageDetails = {
            username: existingUser.username,
            receiverEmail: existingUser.email,
            template: "resetPasswordSuccess"
        };
        const { exchangeName, routingKey } = config_1.notificationServiceExchangeNamesAndRoutingKeys.email;
        (0, auth_producer_1.publishDirectMessage)(server_1.authChannel, exchangeName, routingKey, JSON.stringify(messageDetails), "Password change success message has been sent to notification service.");
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Password successfully updated."
        });
    });
}
exports.changePassword = changePassword;
//# sourceMappingURL=password.js.map