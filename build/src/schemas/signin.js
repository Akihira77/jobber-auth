"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signInSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.signInSchema = joi_1.default.object().keys({
    username: joi_1.default.alternatives().conditional(joi_1.default.string().email(), {
        then: joi_1.default.string().email().required().messages({
            "string.base": "Email must be of type string",
            "string.email": "Invalid email",
            "string.empty": "Email is a required field"
        }),
        otherwise: joi_1.default.string().min(4).max(12).required().messages({
            "string.base": "Username must be of type string",
            "string.min": "Invalid username",
            "string.max": "Invalid username",
            "string.empty": "Username is a required field"
        })
    }),
    password: joi_1.default.string().min(4).max(12).required().messages({
        "string.base": "Password must be of type string",
        "string.min": "Invalid password",
        "string.max": "Invalid password",
        "string.empty": "Password is a required field"
    })
});
//# sourceMappingURL=signin.js.map