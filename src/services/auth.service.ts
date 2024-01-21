import {
    IAuthBuyerMessageDetails,
    IAuthDocument,
    firstLetterUppercase,
    lowerCase
} from "@Akihira77/jobber-shared";
import {
    JWT_TOKEN,
    buyerServiceExchangeNamesAndRoutingKeys
} from "@auth/config";
import { AuthModel } from "@auth/models/auth.model";
import { publishDirectMessage } from "@auth/queues/auth.producer";
import { authChannel } from "@auth/server";
import { sign } from "jsonwebtoken";
import { omit } from "lodash";
import { Model, Op } from "sequelize";

export async function createAuthUser(
    data: IAuthDocument
): Promise<IAuthDocument> {
    const result: Model = await AuthModel.create(data);
    const messageDetails: IAuthBuyerMessageDetails = {
        username: result.dataValues.username!,
        email: result.dataValues.email!,
        country: result.dataValues.country!,
        profilePicture: result.dataValues.profilePicture!,
        createdAt: result.dataValues.createdAt!,
        type: "auth"
    };

    const { exchangeName, routingKey } =
        buyerServiceExchangeNamesAndRoutingKeys.buyer;
    await publishDirectMessage(
        authChannel,
        exchangeName,
        routingKey,
        JSON.stringify(messageDetails),
        "Buyer details sent to buyer service."
    );

    const userData = omit(result.dataValues, ["password"]) as IAuthDocument;

    return userData;
}

export async function getAuthUserById(id: number): Promise<IAuthDocument> {
    const user = (await AuthModel.findOne({
        where: { id },
        attributes: {
            exclude: ["password"]
        }
    })) as Model<IAuthDocument>;

    return user?.dataValues;
}

export async function getUserByUsernameOrEmail(
    username: string,
    email: string
): Promise<IAuthDocument> {
    const user = (await AuthModel.findOne({
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
    })) as Model<IAuthDocument>;

    return user?.dataValues;
}

export async function getUserByUsername(
    username: string
): Promise<IAuthDocument> {
    const user = (await AuthModel.findOne({
        where: {
            username: firstLetterUppercase(username)
        }
    })) as Model<IAuthDocument>;

    return user?.dataValues;
}

export async function getUserByEmail(email: string): Promise<IAuthDocument> {
    const user = (await AuthModel.findOne({
        where: {
            email: lowerCase(email)
        }
    })) as Model<IAuthDocument>;

    return user?.dataValues;
}

export async function getAuthUserByVerificationToken(
    token: string
): Promise<IAuthDocument> {
    const user = (await AuthModel.findOne({
        where: {
            emailVerificationToken: token
        },
        attributes: {
            exclude: ["password"]
        }
    })) as Model<IAuthDocument>;

    return user?.dataValues;
}

export async function getAuthUserByPasswordToken(
    token: string
): Promise<IAuthDocument> {
    const user = (await AuthModel.findOne({
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
    })) as Model<IAuthDocument>;

    return user?.dataValues;
}

export async function updateVerifyEmail(
    id: number,
    emailVerified: number,
    emailVerificationToken: string
): Promise<void> {
    await AuthModel.update(
        {
            emailVerified,
            emailVerificationToken
        },
        {
            where: { id }
        }
    );
}

export async function updatePasswordToken(
    id: number,
    token: string,
    tokenExpiration: Date
): Promise<void> {
    await AuthModel.update(
        {
            passwordResetToken: token,
            passwordResetExpires: tokenExpiration
        },
        {
            where: { id }
        }
    );
}

export async function updatePassword(
    id: number,
    password: string
): Promise<void> {
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
}

export function signToken(id: number, email: string, username: string): string {
    return sign(
        {
            id,
            email,
            username
        },
        JWT_TOKEN!
    );
}
