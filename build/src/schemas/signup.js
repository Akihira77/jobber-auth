"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUpSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.signUpSchema = joi_1.default.object().keys({
    username: joi_1.default.string().min(4).max(12).required().messages({
        "string.base": "Username must be of type string",
        "string.min": "Invalid username",
        "string.max": "Invalid username",
        "string.empty": "Username is a required field"
    }),
    password: joi_1.default.string().min(4).max(12).required().messages({
        "string.base": "Password must be of type string",
        "string.min": "Invalid password",
        "string.max": "Invalid password",
        "string.empty": "Password is a required field"
    }),
    country: joi_1.default.string().min(1).required().messages({
        "string.base": "Country must be of type string",
        "string.min": "Invalid country",
        "string.empty": "Country is a required field"
    }),
    email: joi_1.default.string().email().required().messages({
        "string.base": "Email must be of type string",
        "string.email": "Invalid email",
        "string.empty": "Email is a required field"
    }),
    profilePicture: joi_1.default.string().required().messages({
        "string.base": "Please add a profile picture",
        "string.empty": "Profile Picture is a required field"
    })
});
//# sourceMappingURL=signup.js.map