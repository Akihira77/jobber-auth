"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.resetPasswordSchema = exports.emailSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.emailSchema = joi_1.default.object().keys({
    email: joi_1.default.string().email().required().messages({
        "string.base": "Field must be valid",
        "string.required": "Field must be valid",
        "string.email": "Field must be valid"
    })
});
exports.resetPasswordSchema = joi_1.default.object().keys({
    password: joi_1.default.string().required().min(4).max(12).messages({
        "string.base": "Password should be of type string",
        "string.min": "Invalid password",
        "string.max": "Invalid password",
        "string.empty": "Password is a required field"
    }),
    confirmPassword: joi_1.default.string().required().valid(joi_1.default.ref("password")).messages({
        "any.only": "Passwords should match",
        "any.required": "Confirm password is a required field"
    })
});
exports.changePasswordSchema = joi_1.default.object().keys({
    currentPassword: joi_1.default.string().required().min(4).max(12).messages({
        "string.base": "Current Password should be of type string",
        "string.min": "Invalid password",
        "string.max": "Invalid password",
        "string.empty": "Current Password is a required field"
    }),
    newPassword: joi_1.default.string().required().min(4).max(12).messages({
        "string.base": "New Password should be of type string",
        "string.min": "Invalid password",
        "string.max": "Invalid password",
        "string.empty": "New Password is a required field"
    })
});
//# sourceMappingURL=password.js.map