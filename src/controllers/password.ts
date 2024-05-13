import crypto from "crypto";

import {
    BadRequestError,
    IEmailMessageDetails,
    NotFoundError
} from "@Akihira77/jobber-shared";
import {
    changePasswordSchema,
    emailSchema,
    resetPasswordSchema
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
    const { error } = emailSchema.validate(req.body);

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Password sendForgotPasswordLinkToEmailUser() method error"
        );
    }

    const { email } = req.body;
    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
        throw new NotFoundError(
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
    publishDirectMessage(
        authChannel,
        exchangeName,
        routingKey,
        JSON.stringify(messageDetails),
        "Forgot password message has been sent to notification service."
    );

    res.status(StatusCodes.OK).json({
        message: "Password reset password has been sent."
    });
}

export async function resetPassword(
    req: Request,
    res: Response
): Promise<void> {
    const { error } = resetPasswordSchema.validate(req.body);

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Password resetPassword() method error"
        );
    }

    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        throw new BadRequestError(
            "Passwords not match",
            "Password resetPassword() method error"
        );
    }

    const { token } = req.params;

    const existingUser = await getAuthUserByPasswordToken(token);

    if (!existingUser) {
        throw new NotFoundError(
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
    publishDirectMessage(
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
    const { error } = changePasswordSchema.validate(req.body);

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Password changePassword() method error"
        );
    }

    const { currentPassword, newPassword } = req.body;

    const existingUser = await getUserByUsername(
        req.currentUser!.username
    );

    if (!existingUser) {
        throw new NotFoundError("User is not found", "Password changePassword() method error")
    }

    const isValidPassword: boolean = await AuthModel.prototype.comparePassword(
        currentPassword,
        existingUser.password ?? ""
    );

    if (!isValidPassword) {
        throw new BadRequestError(
            "Invalid password.",
            "Password changePassword() method error"
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
    publishDirectMessage(
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
