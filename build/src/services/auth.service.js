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
exports.signToken = exports.updatePassword = exports.updatePasswordToken = exports.updateVerifyEmail = exports.getAuthUserByPasswordToken = exports.getAuthUserByVerificationToken = exports.getUserByEmail = exports.getUserByUsername = exports.getUserByUsernameOrEmail = exports.getAuthUserById = exports.createAuthUser = void 0;
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("../config");
const auth_model_1 = require("../models/auth.model");
const auth_producer_1 = require("../queues/auth.producer");
const server_1 = require("../server");
const jsonwebtoken_1 = require("jsonwebtoken");
const lodash_1 = require("lodash");
const sequelize_1 = require("sequelize");
const logger = (0, jobber_shared_1.winstonLogger)(`${config_1.ELASTIC_SEARCH_URL}`, "authService", "debug");
function createAuthUser(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield auth_model_1.AuthModel.create(data);
            console.log(result.dataValues);
            const messageDetails = {
                username: result.dataValues.username,
                email: result.dataValues.email,
                country: result.dataValues.country,
                profilePicture: result.dataValues.profilePicture,
                createdAt: result.dataValues.createdAt,
                type: "auth"
            };
            const { buyer } = config_1.buyerServiceExchangeNamesAndRoutingKeys;
            yield (0, auth_producer_1.publishDirectMessage)(server_1.authChannel, buyer.exchangeName, buyer.routingKey, JSON.stringify(messageDetails), "Buyer details sent to users service (buyer).");
            const userData = (0, lodash_1.omit)(result.dataValues, ["password"]);
            return userData;
        }
        catch (error) {
            logger.error("AuthService createAuthUser() method error", error);
            throw new Error("Unexpected error occured. Please try again.");
        }
    });
}
exports.createAuthUser = createAuthUser;
function getAuthUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield auth_model_1.AuthModel.findOne({
            where: { id },
            attributes: {
                exclude: ["password"]
            }
        });
        return user === null || user === void 0 ? void 0 : user.dataValues;
    });
}
exports.getAuthUserById = getAuthUserById;
function getUserByUsernameOrEmail(username, email) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield auth_model_1.AuthModel.findOne({
            where: {
                [sequelize_1.Op.or]: [
                    {
                        username: (0, jobber_shared_1.firstLetterUppercase)(username)
                    },
                    {
                        email: (0, jobber_shared_1.lowerCase)(email)
                    }
                ]
            },
            attributes: {
                exclude: ["password"]
            }
        });
        return user === null || user === void 0 ? void 0 : user.dataValues;
    });
}
exports.getUserByUsernameOrEmail = getUserByUsernameOrEmail;
function getUserByUsername(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield auth_model_1.AuthModel.findOne({
            where: {
                username: (0, jobber_shared_1.firstLetterUppercase)(username)
            }
        });
        return user === null || user === void 0 ? void 0 : user.dataValues;
    });
}
exports.getUserByUsername = getUserByUsername;
function getUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield auth_model_1.AuthModel.findOne({
            where: {
                email: (0, jobber_shared_1.lowerCase)(email)
            }
        });
        return user === null || user === void 0 ? void 0 : user.dataValues;
    });
}
exports.getUserByEmail = getUserByEmail;
function getAuthUserByVerificationToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield auth_model_1.AuthModel.findOne({
            where: {
                emailVerificationToken: token
            },
            attributes: {
                exclude: ["password"]
            }
        });
        return user === null || user === void 0 ? void 0 : user.dataValues;
    });
}
exports.getAuthUserByVerificationToken = getAuthUserByVerificationToken;
function getAuthUserByPasswordToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield auth_model_1.AuthModel.findOne({
            where: {
                [sequelize_1.Op.or]: [
                    {
                        passwordResetToken: token
                    },
                    {
                        passwordResetExpires: { [sequelize_1.Op.gt]: new Date() }
                    }
                ]
            }
        });
        return user === null || user === void 0 ? void 0 : user.dataValues;
    });
}
exports.getAuthUserByPasswordToken = getAuthUserByPasswordToken;
function updateVerifyEmail(id, emailVerified, emailVerificationToken) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield auth_model_1.AuthModel.update(!emailVerificationToken
                ? {
                    emailVerified
                }
                : {
                    emailVerified,
                    emailVerificationToken
                }, {
                where: { id }
            });
        }
        catch (error) {
            logger.error("AuthService updateVerifyEmail() method error", error);
            throw error;
        }
    });
}
exports.updateVerifyEmail = updateVerifyEmail;
function updatePasswordToken(id, token, tokenExpiration) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield auth_model_1.AuthModel.update({
                passwordResetToken: token,
                passwordResetExpires: tokenExpiration
            }, {
                where: { id }
            });
        }
        catch (error) {
            logger.error("AuthService updatePasswordToken() method error", error);
        }
    });
}
exports.updatePasswordToken = updatePasswordToken;
function updatePassword(id, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield auth_model_1.AuthModel.update({
                password,
                passwordResetToken: "",
                passwordResetExpires: new Date()
            }, {
                where: { id }
            });
        }
        catch (error) {
            logger.error("AuthService updatePassword() method error", error);
            throw error;
        }
    });
}
exports.updatePassword = updatePassword;
function signToken(id, email, username) {
    return (0, jsonwebtoken_1.sign)({
        id,
        email,
        username
    }, config_1.JWT_TOKEN, {
        algorithm: "HS512",
        issuer: "Jobber Auth",
        expiresIn: "1d"
    });
}
exports.signToken = signToken;
//# sourceMappingURL=auth.service.js.map