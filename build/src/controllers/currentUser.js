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
exports.resendVerificationEmail = exports.getCurrentUser = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const auth_service_1 = require("../services/auth.service");
const http_status_codes_1 = require("http-status-codes");
const config_1 = require("../config");
const server_1 = require("../server");
const auth_producer_1 = require("../queues/auth.producer");
function getCurrentUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let user = null;
        const existingUser = yield (0, auth_service_1.getAuthUserById)(req.currentUser.id);
        if (!existingUser) {
            throw new jobber_shared_1.NotFoundError("User is not found", "CurrentUser getCurrentUser() method error");
        }
        if (Object.keys(existingUser).length) {
            user = existingUser;
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({ message: "Authenticated user", user });
    });
}
exports.getCurrentUser = getCurrentUser;
function resendVerificationEmail(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email } = req.body;
        const checkIfUserExist = yield (0, auth_service_1.getUserByEmail)(email);
        if (!checkIfUserExist) {
            throw new jobber_shared_1.NotFoundError("Email is invalid", "currentUser resendVerificationEmail() method error");
        }
        const randomBytes = yield Promise.resolve(crypto_1.default.randomBytes(20));
        const randomCharacters = randomBytes.toString("hex");
        const verificationLink = `${config_1.CLIENT_URL}/confirm_email?v_token=${randomCharacters}`;
        yield (0, auth_service_1.updateVerifyEmail)(checkIfUserExist.id, 0, randomCharacters);
        const messageDetails = {
            receiverEmail: (0, jobber_shared_1.lowerCase)(email),
            verifyLink: verificationLink,
            template: "verifyEmail"
        };
        const { exchangeName, routingKey } = config_1.notificationServiceExchangeNamesAndRoutingKeys.email;
        (0, auth_producer_1.publishDirectMessage)(server_1.authChannel, exchangeName, routingKey, JSON.stringify(messageDetails), "Verify email message has been sent to notification service.");
        const updatedUser = yield (0, auth_service_1.getAuthUserById)(checkIfUserExist.id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Email verification has been sent",
            user: updatedUser
        });
    });
}
exports.resendVerificationEmail = resendVerificationEmail;
//# sourceMappingURL=currentUser.js.map