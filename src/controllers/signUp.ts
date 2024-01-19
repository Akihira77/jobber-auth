import crypto from "crypto";

import {
    BadRequestError,
    IAuthDocument,
    IEmailMessageDetails,
    firstLetterUppercase,
    lowerCase,
    uploads
} from "@Akihira77/jobber-shared";
import { signUpSchema } from "@auth/schemas/signup";
import {
    createAuthUser,
    getUserByUsernameOrEmail,
    signToken
} from "@auth/services/auth.service";
import { UploadApiResponse } from "cloudinary";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
    CLIENT_URL,
    notificationServiceExchangeNamesAndRoutingKeys
} from "@auth/config";
import { publishDirectMessage } from "@auth/queues/auth.producer";
import { authChannel } from "@auth/server";
import { StatusCodes } from "http-status-codes";

export async function signUp(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(signUpSchema.validate(req.body));

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "signUp signUp() method error"
        );
    }

    const { username, email, password, country, profilePicture } = req.body;
    const checkIfUserExist: IAuthDocument = await getUserByUsernameOrEmail(
        username,
        email
    );

    if (checkIfUserExist) {
        throw new BadRequestError(
            "Invalid credentials. Email or Username",
            "signUp create() method error"
        );
    }

    const profilePublicId = uuidv4();
    const uploadResult = (await uploads(
        profilePicture,
        `${profilePublicId}`,
        true,
        true
    )) as UploadApiResponse;

    if (!uploadResult.public_id) {
        throw new BadRequestError(
            "File upload error. Try again",
            "signUp create() method error"
        );
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString("hex");
    const authData: IAuthDocument = {
        username: firstLetterUppercase(username),
        email: lowerCase(email),
        profilePublicId,
        password,
        country,
        profilePicture: uploadResult?.secure_url,
        emailVerificationToken: randomCharacters
    };
    const result: IAuthDocument = await createAuthUser(authData);
    const verificationLink = `${CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;
    const messageDetails: IEmailMessageDetails = {
        receiverEmail: result.email,
        verifyLink: verificationLink,
        template: "verifyEmail"
    };

    // publish to 2-notification-service > consumeAuthEmailMessages
    const { exchangeName, routingKey } =
        notificationServiceExchangeNamesAndRoutingKeys.email;
    await publishDirectMessage(
        authChannel,
        exchangeName,
        routingKey,
        JSON.stringify(messageDetails),
        "Verify email message has been sent to notification service."
    );

    const userJwt: string = signToken(
        result.id!,
        result.email!,
        result.username!
    );

    res.status(StatusCodes.CREATED).json({
        message: "User created successfully",
        user: result,
        token: userJwt
    });
}
