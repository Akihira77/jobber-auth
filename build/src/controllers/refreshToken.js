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
exports.getRefreshToken = void 0;
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const auth_service_1 = require("../services/auth.service");
const http_status_codes_1 = require("http-status-codes");
function getRefreshToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const existingUser = yield (0, auth_service_1.getUserByUsername)(req.params.username);
        if (!existingUser) {
            throw new jobber_shared_1.NotFoundError("User is not found.", "Password resetPassword() method error");
        }
        const userJWT = (0, auth_service_1.signToken)(existingUser.id, existingUser.email, existingUser.username);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Refresh token generated",
            user: existingUser,
            token: userJWT
        });
    });
}
exports.getRefreshToken = getRefreshToken;
//# sourceMappingURL=refreshToken.js.map