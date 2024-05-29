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
exports.AuthModel = void 0;
const database_1 = require("../database");
const bcryptjs_1 = require("bcryptjs");
const sequelize_1 = require("sequelize");
const config_1 = require("../config");
const SALT_ROUND = 10;
// type AuthUserCreationAttributes = Optional<
//     IAuthDocument,
//     | "id"
//     | "createdAt"
//     | "passwordResetToken"
//     | "passwordResetExpires"
//     | "comparePassword"
//     | "hashPassword"
// >;
class Auth extends sequelize_1.Model {
    comparePassword(password, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, bcryptjs_1.compare)(password, hashedPassword);
        });
    }
    hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, bcryptjs_1.hash)(password, SALT_ROUND);
        });
    }
}
Auth.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    username: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    profilePublicId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    country: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    profilePicture: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    emailVerificationToken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    emailVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: new Date()
    },
    passwordResetToken: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    passwordResetExpires: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date()
    }
}, {
    sequelize: database_1.sequelize,
    modelName: "Auths",
    hooks: {
        beforeCreate: (auth) => __awaiter(void 0, void 0, void 0, function* () {
            const hashedPassword = yield (0, bcryptjs_1.hash)(auth.dataValues.password, SALT_ROUND);
            auth.dataValues.password = hashedPassword;
        })
    },
    indexes: [
        {
            unique: true,
            fields: ["email"]
        },
        {
            unique: true,
            fields: ["username"]
        },
        {
            unique: true,
            fields: ["emailVerificationToken"]
        }
    ]
});
if (config_1.NODE_ENV !== "test") {
    Auth.sync({});
}
exports.AuthModel = Auth;
//# sourceMappingURL=auth.model.js.map