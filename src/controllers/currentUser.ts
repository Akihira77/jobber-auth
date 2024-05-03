import crypto from "crypto";

import {
    IEmailMessageDetails,
    lowerCase,
    NotFoundError
} from "@Akihira77/jobber-shared";
import {
    getAuthUserById,
    getUserByEmail,
    updateVerifyEmail
} from "@auth/services/auth.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
    CLIENT_URL,
    notificationServiceExchangeNamesAndRoutingKeys
} from "@auth/config";
import { authChannel } from "@auth/server";
import { publishDirectMessage } from "@auth/queues/auth.producer";

export async function getCurrentUser(
    req: Request,
    res: Response
): Promise<void> {
    let user = null;
    const existingUser = await getAuthUserById(
        req.currentUser!.id
    );

    if (!existingUser) {
        throw new NotFoundError("User is not found", "CurrentUser getCurrentUser() method error")
    }

    if (Object.keys(existingUser).length) {
        user = existingUser;
    }

    res.status(StatusCodes.OK).json({ message: "Authenticated user", user });
}

export async function resendVerificationEmail(
    req: Request,
    res: Response
): Promise<void> {
    const { email } = req.body;
    const checkIfUserExist = await getUserByEmail(email);

    if (!checkIfUserExist) {
        throw new NotFoundError(
            "Email is invalid",
            "currentUser resendVerificationEmail() method error"
        );
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString("hex");
    const verificationLink = `${CLIENT_URL}/confirm_email?v_token=${randomCharacters}`;

    await updateVerifyEmail(checkIfUserExist.id!, 0, randomCharacters);

    const messageDetails: IEmailMessageDetails = {
        receiverEmail: lowerCase(email),
        verifyLink: verificationLink,
        template: "verifyEmail"
    };

    // publish to 2-notification-service > consumeAuthEmailMessages
    const { exchangeName, routingKey } =
        notificationServiceExchangeNamesAndRoutingKeys.email;
    publishDirectMessage(
        authChannel,
        exchangeName,
        routingKey,
        JSON.stringify(messageDetails),
        "Verify email message has been sent to notification service."
    );

    const updatedUser = await getAuthUserById(checkIfUserExist.id!);

    res.status(StatusCodes.OK).json({
        message: "Email verification has been sent",
        user: updatedUser
    });
}
