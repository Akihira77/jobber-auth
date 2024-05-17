import { sequelize } from "@auth/database";
import { IAuthDocument } from "@Akihira77/jobber-shared";
import { compare, hash } from "bcryptjs";
import { DataTypes, Model } from "sequelize";
import { NODE_ENV } from "@auth/config";

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

class Auth extends Model<IAuthDocument> {
    async comparePassword(
        password: string,
        hashedPassword: string
    ): Promise<boolean> {
        return compare(password, hashedPassword);
    }

    async hashPassword(password: string): Promise<string> {
        return hash(password, SALT_ROUND);
    }
}

Auth.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        profilePublicId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        country: {
            type: DataTypes.STRING,
            allowNull: false
        },
        profilePicture: {
            type: DataTypes.STRING,
            allowNull: false
        },
        emailVerificationToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        emailVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 0
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: new Date()
        },
        passwordResetToken: { type: DataTypes.STRING, allowNull: true },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date()
        }
    },
    {
        sequelize,
        modelName: "Auths",
        hooks: {
            beforeCreate: async (auth: Auth) => {
                const hashedPassword: string = await hash(
                    auth.dataValues.password!,
                    SALT_ROUND
                );
                auth.dataValues.password = hashedPassword;
            }
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
    }
);

if (NODE_ENV !== "test") {
    Auth.sync({});
}

export const AuthModel = Auth;
