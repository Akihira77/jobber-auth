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
exports.signUp = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const signup_1 = require("../schemas/signup");
const auth_service_1 = require("../services/auth.service");
const uuid_1 = require("uuid");
const config_1 = require("../config");
const auth_producer_1 = require("../queues/auth.producer");
const server_1 = require("../server");
const http_status_codes_1 = require("http-status-codes");
function signUp(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = signup_1.signUpSchema.validate(req.body);
        if (error === null || error === void 0 ? void 0 : error.details) {
            throw new jobber_shared_1.BadRequestError(error.details[0].message, "signUp signUp() method error");
        }
        const { username, email, password, country, profilePicture } = req.body;
        const checkIfUserExist = yield (0, auth_service_1.getUserByUsernameOrEmail)(username, email);
        if (checkIfUserExist) {
            throw new jobber_shared_1.BadRequestError("Invalid credentials. Email or Username", "signUp create() method error");
        }
        const profilePublicId = (0, uuid_1.v4)();
        const uploadResult = (yield (0, jobber_shared_1.uploads)(profilePicture, profilePublicId, true, true));
        if (!uploadResult.public_id) {
            throw new jobber_shared_1.BadRequestError("File upload error. Try again", "signUp create() method error");
        }
        const randomBytes = crypto_1.default.randomBytes(20);
        const randomCharacters = randomBytes.toString("hex");
        const authData = {
            username: (0, jobber_shared_1.firstLetterUppercase)(username),
            email: (0, jobber_shared_1.lowerCase)(email),
            profilePublicId,
            password,
            country,
            profilePicture: uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.secure_url,
            emailVerificationToken: randomCharacters
        };
        const result = yield (0, auth_service_1.createAuthUser)(authData);
        const verificationLink = `${config_1.CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;
        const messageDetails = {
            receiverEmail: result.email,
            verifyLink: verificationLink,
            template: "verifyEmail"
        };
        // publish to 2-notification-service > consumeAuthEmailMessages
        const { exchangeName, routingKey } = config_1.notificationServiceExchangeNamesAndRoutingKeys.email;
        (0, auth_producer_1.publishDirectMessage)(server_1.authChannel, exchangeName, routingKey, JSON.stringify(messageDetails), "Verify email message has been sent to notification service.");
        const userJwt = (0, auth_service_1.signToken)(result.id, result.email, result.username);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            message: "User created successfully",
            user: result,
            token: userJwt
        });
    });
}
exports.signUp = signUp;
//# sourceMappingURL=signUp.js.map