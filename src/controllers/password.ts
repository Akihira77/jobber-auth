import crypto from "crypto";

import {
    BadRequestError,
    IAuthDocument,
    IEmailMessageDetails
} from "@Akihira77/jobber-shared";
import {
    changePasswordSchema,
    emailSchema,
    passwordSchema
} from "@auth/schemas/password";
import {
    getAuthUserByPasswordToken,
    getUserByEmail,
    getUserByUsername,
    updatePassword,
    updatePasswordToken
} from "@auth/services/auth.service";
import { Request, Response } from "express";
import {
    CLIENT_URL,
    notificationServiceExchangeNamesAndRoutingKeys
} from "@auth/config";
import { publishDirectMessage } from "@auth/queues/auth.producer";
import { authChannel } from "@auth/server";
import { StatusCodes } from "http-status-codes";
import { AuthModel } from "@auth/models/auth.model";

export async function sendForgotPasswordLinkToEmailUser(
    req: Request,
    res: Response
): Promise<void> {
    const { error } = await Promise.resolve(emailSchema.validate(req.body));

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Password sendForgotPasswordLinkToEmailUser() method error"
        );
    }

    const { email } = req.body;
    const existingUser: IAuthDocument = await getUserByEmail(email);

    if (!existingUser) {
        throw new BadRequestError(
            "Invalid credentials",
            "Password sendForgotPasswordLinkToEmailUser() method error"
        );
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString("hex");
    const date = new Date();
    date.setHours(date.getHours() + 1);
    await updatePasswordToken(existingUser.id!, randomCharacters, date);

    // publish to 2-notification-service > consumeAuthEmailMessages
    const resetLink = `${CLIENT_URL}/reset_password?token=${randomCharacters}`;
    const messageDetails: IEmailMessageDetails = {
        receiverEmail: existingUser.email!,
        resetLink,
        username: existingUser.username!,
        template: "forgotPassword"
    };
    const { exchangeName, routingKey } =
        notificationServiceExchangeNamesAndRoutingKeys.email;
    await publishDirectMessage(
        authChannel,
        exchangeName,
        routingKey,
        JSON.stringify(messageDetails),
        "Forgot password message has been sent to notification service."
    );

    res.status(StatusCodes.OK).json({
        message: "Password reset email has been sent."
    });
}

export async function resetPassword(
    req: Request,
    res: Response
): Promise<void> {
    const { error } = await Promise.resolve(passwordSchema.validate(req.body));

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Password resetPassword() method error"
        );
    }

    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        throw new BadRequestError("Passwords not match", "Password resetPassword() method error");
    }

    const { token } = req.params;

    const existingUser: IAuthDocument = await getAuthUserByPasswordToken(token);

    if (!existingUser) {
        throw new BadRequestError(
            "Reset token has expired.",
            "Password resetPassword() method error"
        );
    }

    const hashedPassword = await AuthModel.prototype.hashPassword(password);
    await updatePassword(existingUser.id!, hashedPassword);

    // publish to 2-notification-service > consumeAuthEmailMessages
    const messageDetails: IEmailMessageDetails = {
        username: existingUser.username!,
        receiverEmail: existingUser.email!,
        template: "resetPasswordSuccess"
    };
    const { exchangeName, routingKey } =
        notificationServiceExchangeNamesAndRoutingKeys.email;
    await publishDirectMessage(
        authChannel,
        exchangeName,
        routingKey,
        JSON.stringify(messageDetails),
        "Reset password success message has been sent to notification service."
    );

    res.status(StatusCodes.OK).json({
        message: "Password successfully updated."
    });
}

export async function changePassword(
    req: Request,
    res: Response
): Promise<void> {
    const { error } = await Promise.resolve(
        changePasswordSchema.validate(req.body)
    );

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Password resetPassword() method error"
        );
    }

    const { currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
        throw new BadRequestError(
            "Password cannot same as previous password.",
            "Password changePassword() method error"
        );
    }

    const existingUser: IAuthDocument = await getUserByUsername(
        req.currentUser!.username
    );

    const isValidPassword: boolean = await AuthModel.prototype.comparePassword(currentPassword, existingUser.password ?? "");

    if (!existingUser || !isValidPassword) {
        throw new BadRequestError(
            "Invalid password.",
            "Password resetPassword() method error"
            );
        }


    const hashedPassword = await AuthModel.prototype.hashPassword(newPassword);
    await updatePassword(existingUser.id!, hashedPassword);

    // publish to 2-notification-service > consumeAuthEmailMessages
    const messageDetails: IEmailMessageDetails = {
        username: existingUser.username!,
        receiverEmail: existingUser.email!,
        template: "resetPasswordSuccess"
    };
    const { exchangeName, routingKey } =
        notificationServiceExchangeNamesAndRoutingKeys.email;
    await publishDirectMessage(
        authChannel,
        exchangeName,
        routingKey,
        JSON.stringify(messageDetails),
        "Password change success message has been sent to notification service."
    );

    res.status(StatusCodes.OK).json({
        message: "Password successfully updated."
    });
}
