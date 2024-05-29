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
Object.defineProperty(exports, "__esModule", { value: true });
exports.signIn = void 0;
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const auth_model_1 = require("../models/auth.model");
const signin_1 = require("../schemas/signin");
const auth_service_1 = require("../services/auth.service");
const http_status_codes_1 = require("http-status-codes");
const lodash_1 = require("lodash");
function signIn(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = signin_1.signInSchema.validate(req.body);
        if (error === null || error === void 0 ? void 0 : error.details) {
            throw new jobber_shared_1.BadRequestError(error.details[0].message, "signIn signIn() method error");
        }
        const { username, password } = req.body;
        const isValidEmail = (0, jobber_shared_1.isEmail)(username);
        const existingUser = isValidEmail
            ? yield (0, auth_service_1.getUserByEmail)(username)
            : yield (0, auth_service_1.getUserByUsername)(username);
        if (!existingUser) {
            throw new jobber_shared_1.BadRequestError("Invalid credentials", "signIn signIn() method error");
        }
        const passwordMatch = yield auth_model_1.AuthModel.prototype.comparePassword(password, existingUser.password);
        if (!passwordMatch) {
            throw new jobber_shared_1.BadRequestError("Invalid credentials", "signIn signIn() method error");
        }
        const userJWT = (0, auth_service_1.signToken)(existingUser.id, existingUser.email, existingUser.username);
        const userData = (0, lodash_1.omit)(existingUser, ["password"]);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "User sign in successfully",
            user: userData,
            token: userJWT
        });
    });
}
exports.signIn = signIn;
//# sourceMappingURL=signIn.js.map