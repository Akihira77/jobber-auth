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
exports.verifyEmail = void 0;
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const auth_service_1 = require("../services/auth.service");
const http_status_codes_1 = require("http-status-codes");
function verifyEmail(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { token } = req.body;
            const checkIfUserExist = yield (0, auth_service_1.getAuthUserByVerificationToken)(token);
            if (!checkIfUserExist) {
                throw new jobber_shared_1.BadRequestError("Verification token is either invalid or already used.", "verifyEmail verifyEmail() method error");
            }
            yield (0, auth_service_1.updateVerifyEmail)(checkIfUserExist.id, 1);
            const updatedUser = yield (0, auth_service_1.getAuthUserById)(checkIfUserExist.id);
            res.status(http_status_codes_1.StatusCodes.OK).json({
                message: "Email verified successfully.",
                user: updatedUser
            });
        }
        catch (error) {
            if (error) {
                throw error;
            }
            throw new jobber_shared_1.BadRequestError("There is an error from server. Please try Resend Email again", "verifyEmail verifyEmail() method error");
        }
    });
}
exports.verifyEmail = verifyEmail;
//# sourceMappingURL=verifyEmail.js.map