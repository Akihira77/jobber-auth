import {
    IAuthBuyerMessageDetails,
    IAuthDocument,
    firstLetterUppercase,
    lowerCase,
    winstonLogger
} from "@Akihira77/jobber-shared";
import {
    ELASTIC_SEARCH_URL,
    JWT_TOKEN,
    buyerServiceExchangeNamesAndRoutingKeys
} from "@auth/config";
import { AuthModel } from "@auth/models/auth.model";
import { publishDirectMessage } from "@auth/queues/auth.producer";
import { authChannel } from "@auth/server";
import { sign } from "jsonwebtoken";
import { omit } from "lodash";
import { Op } from "sequelize";
import { Logger } from "winston";

const logger: Logger = winstonLogger(
    `${ELASTIC_SEARCH_URL}`,
    "authService",
    "debug"
);

export async function createAuthUser(
    data: IAuthDocument
): Promise<IAuthDocument> {
    try {
        const result = await AuthModel.create(data);
        console.log(result.dataValues);
        const messageDetails: IAuthBuyerMessageDetails = {
            username: result.dataValues.username,
            email: result.dataValues.email,
            country: result.dataValues.country,
            profilePicture: result.dataValues.profilePicture,
            createdAt: result.dataValues.createdAt,
            type: "auth"
        };

        const { buyer } = buyerServiceExchangeNamesAndRoutingKeys;
        await publishDirectMessage(
            authChannel,
            buyer.exchangeName,
            buyer.routingKey,
            JSON.stringify(messageDetails),
            "Buyer details sent to users service (buyer)."
        );

        const userData = omit(result.dataValues, ["password"]) as IAuthDocument;

        return userData;
    } catch (error) {
        logger.error("AuthService createAuthUser() method error", error);
        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function getAuthUserById(
    id: number
): Promise<IAuthDocument | undefined> {
    const user = await AuthModel.findOne({
        where: { id },
        attributes: {
            exclude: ["password"]
        }
    });

    return user?.dataValues;
}

export async function getUserByUsernameOrEmail(
    username: string,
    email: string
): Promise<IAuthDocument | undefined> {
    const user = await AuthModel.findOne({
        where: {
            [Op.or]: [
                {
                    username: firstLetterUppercase(username)
                },
                {
                    email: lowerCase(email)
                }
            ]
        },
        attributes: {
            exclude: ["password"]
        }
    });

    return user?.dataValues;
}

export async function getUserByUsername(
    username: string
): Promise<IAuthDocument | undefined> {
    const user = await AuthModel.findOne({
        where: {
            username: firstLetterUppercase(username)
        }
    });

    return user?.dataValues;
}

export async function getUserByEmail(
    email: string
): Promise<IAuthDocument | undefined> {
    const user = await AuthModel.findOne({
        where: {
            email: lowerCase(email)
        }
    });

    return user?.dataValues;
}

export async function getAuthUserByVerificationToken(
    token: string
): Promise<IAuthDocument | undefined> {
    const user = await AuthModel.findOne({
        where: {
            emailVerificationToken: token
        },
        attributes: {
            exclude: ["password"]
        }
    });

    return user?.dataValues;
}

export async function getAuthUserByPasswordToken(
    token: string
): Promise<IAuthDocument | undefined> {
    const user = await AuthModel.findOne({
        where: {
            [Op.or]: [
                {
                    passwordResetToken: token
                },
                {
                    passwordResetExpires: { [Op.gt]: new Date() }
                }
            ]
        }
    });

    return user?.dataValues;
}

export async function updateVerifyEmail(
    id: number,
    emailVerified: number,
    emailVerificationToken?: string
): Promise<void> {
    try {
        await AuthModel.update(
            !emailVerificationToken
                ? {
                      emailVerified
                  }
                : {
                      emailVerified,
                      emailVerificationToken
                  },
            {
                where: { id }
            }
        );
    } catch (error) {
        logger.error("AuthService updateVerifyEmail() method error", error);
        throw error;
    }
}

export async function updatePasswordToken(
    id: number,
    token: string,
    tokenExpiration: Date
): Promise<void> {
    try {
        await AuthModel.update(
            {
                passwordResetToken: token,
                passwordResetExpires: tokenExpiration
            },
            {
                where: { id }
            }
        );
    } catch (error) {
        logger.error("AuthService updatePasswordToken() method error", error);
    }
}

export async function updatePassword(
    id: number,
    password: string
): Promise<void> {
    try {
        await AuthModel.update(
            {
                password,
                passwordResetToken: "",
                passwordResetExpires: new Date()
            },
            {
                where: { id }
            }
        );
    } catch (error) {
        logger.error("AuthService updatePassword() method error", error);
        throw error;
    }
}

export function signToken(id: number, email: string, username: string): string {
    return sign(
        {
            id,
            email,
            username
        },
        JWT_TOKEN!,
        {
            algorithm: "HS512",
            issuer: "Jobber Auth",
            expiresIn: "1d"
        }
    );
}
