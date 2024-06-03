import crypto from "crypto";

import {
    BadRequestError,
    firstLetterUppercase,
    IAuthDocument,
    IAuthPayload,
    IEmailMessageDetails,
    IPaginateProps,
    ISearchResult,
    ISellerGig,
    isEmail,
    lowerCase,
    NotFoundError,
    uploads
} from "@Akihira77/jobber-shared";
import {
    CLIENT_URL,
    notificationServiceExchangeNamesAndRoutingKeys
} from "@auth/config";
import { AuthModel } from "@auth/models/auth.model";
import { AuthQueue } from "@auth/queues/auth.queue";
import { signInSchema } from "@auth/schemas/signin";
import { signUpSchema } from "@auth/schemas/signup";
import { AuthService } from "@auth/services/auth.service";
import { UploadApiResponse } from "cloudinary";
import { omit, sample, sortBy } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { generateUsername } from "unique-username-generator";
import { faker } from "@faker-js/faker";
import {
    changePasswordSchema,
    resetPasswordSchema
} from "@auth/schemas/password";
import { UnauthSearchService } from "@auth/services/search.service";

export class AuthHandler {
    private authModel: AuthModel;
    constructor(
        private queue: AuthQueue,
        private authService: AuthService,
        private searchService: UnauthSearchService
    ) {
        this.authModel = new AuthModel();
    }

    // search feature for unauth user
    async gigsQuerySearch(
        params: IPaginateProps,
        query: string,
        delivery_time: string,
        min: number,
        max: number
    ): Promise<{ resultHits: ISellerGig[]; total: number }> {
        let resultHits: ISellerGig[] = [];

        const gigs: ISearchResult = await this.searchService.gigsSearch(
            query,
            params,
            min,
            max,
            delivery_time
        );

        for (const item of gigs.hits) {
            resultHits.push(item._source as ISellerGig);
        }

        if (params.type === "backward") {
            resultHits = sortBy(resultHits, ["sortId"]);
        }

        return { resultHits, total: gigs.total };
    }

    async getSingleGigById(gigId: string): Promise<ISellerGig> {
        const gig = await this.searchService.getGigById("gigs", gigId);

        return gig;
    }

    async signIn(
        reqBody: any
    ): Promise<{ user: Omit<IAuthDocument, "password">; token: string }> {
        const { error, value } = signInSchema.validate(reqBody);

        if (error?.details) {
            throw new BadRequestError(
                error.details[0].message,
                "signIn signIn() method error"
            );
        }

        const { username, password } = value;
        const isValidEmail = isEmail(username);
        const existingUser = isValidEmail
            ? await this.authService.getUserByEmail(username)
            : await this.authService.getUserByUsername(username);

        if (!existingUser) {
            throw new BadRequestError(
                "Invalid credentials",
                "signIn signIn() method error"
            );
        }

        const passwordMatch = await this.authModel.comparePassword(
            password,
            existingUser.password!
        );

        if (!passwordMatch) {
            throw new BadRequestError(
                "Invalid credentials",
                "signIn signIn() method error"
            );
        }

        const userJWT = this.authService.signToken(
            existingUser.id!,
            existingUser.email!,
            existingUser.username!
        );
        const userData = omit(existingUser, ["password"]);

        return { user: userData, token: userJWT };
    }

    async signUp(
        reqBody: any
    ): Promise<{ user: IAuthDocument; token: string }> {
        const { error, value } = signUpSchema.validate(reqBody);

        if (error?.details) {
            throw new BadRequestError(
                error.details[0].message,
                "signUp signUp() method error"
            );
        }

        const { username, email, password, country, profilePicture } = value;
        const checkIfUserExist =
            await this.authService.getUserByUsernameOrEmail(username, email);

        if (checkIfUserExist) {
            throw new BadRequestError(
                "Invalid credentials. Email or Username",
                "signUp create() method error"
            );
        }

        const profilePublicId = uuidv4();
        const uploadResult = (await uploads(
            profilePicture,
            profilePublicId,
            true,
            true
        )) as UploadApiResponse;

        if (!uploadResult.public_id) {
            throw new BadRequestError(
                "File upload error. Try again",
                "signUp create() method error"
            );
        }

        const randomBytes: Buffer = crypto.randomBytes(20);
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
        const result: IAuthDocument =
            await this.authService.createAuthUser(authData);
        const verificationLink = `${CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;
        const messageDetails: IEmailMessageDetails = {
            receiverEmail: result.email,
            verifyLink: verificationLink,
            template: "verifyEmail"
        };

        // publish to 2-notification-service > consumeAuthEmailMessages
        const { exchangeName, routingKey } =
            notificationServiceExchangeNamesAndRoutingKeys.email;
        this.queue.publishDirectMessage(
            exchangeName,
            routingKey,
            JSON.stringify(messageDetails),
            "Verify email message has been sent to notification service."
        );

        const userJwt: string = this.authService.signToken(
            result.id!,
            result.email!,
            result.username!
        );

        return { user: result, token: userJwt };
    }

    async verifyEmail(token: string): Promise<IAuthDocument | undefined> {
        try {
            const checkIfUserExist =
                await this.authService.getAuthUserByVerificationToken(token);
            if (!checkIfUserExist) {
                throw new BadRequestError(
                    "Verification token is either invalid or already used.",
                    "verifyEmail verifyEmail() method error"
                );
            }

            await this.authService.updateVerifyEmail(checkIfUserExist.id!, 1);
            const updatedUser = await this.authService.getAuthUserById(
                checkIfUserExist.id!
            );

            return updatedUser;
        } catch (error) {
            if (error) {
                throw error;
            }

            throw new BadRequestError(
                "There is an error from server. Please try Resend Email again",
                "verifyEmail verifyEmail() method error"
            );
        }
    }

    async getRefreshToken(
        username: string
    ): Promise<{ userJWT: string; user: IAuthDocument | undefined }> {
        const existingUser = await this.authService.getUserByUsername(username);

        if (!existingUser) {
            throw new NotFoundError(
                "User is not found.",
                "Password resetPassword() method error"
            );
        }

        const userJWT: string = this.authService.signToken(
            existingUser.id!,
            existingUser.email!,
            existingUser.username!
        );

        return { userJWT, user: existingUser };
    }

    async getCurrentUser(
        currUser: IAuthPayload
    ): Promise<IAuthDocument | null> {
        let user = null;
        const existingUser = await this.authService.getAuthUserById(
            currUser.id
        );

        if (!existingUser) {
            throw new NotFoundError(
                "User is not found",
                "CurrentUser getCurrentUser() method error"
            );
        }

        if (Object.keys(existingUser).length) {
            user = existingUser;
        }

        return user;
    }

    async resendVerificationEmail(
        email: string
    ): Promise<IAuthDocument | undefined> {
        const checkIfUserExist = await this.authService.getUserByEmail(email);

        if (!checkIfUserExist) {
            throw new NotFoundError(
                "Email is invalid",
                "currentUser resendVerificationEmail() method error"
            );
        }

        const randomBytes: Buffer = await Promise.resolve(
            crypto.randomBytes(20)
        );
        const randomCharacters: string = randomBytes.toString("hex");
        const verificationLink = `${CLIENT_URL}/confirm_email?v_token=${randomCharacters}`;

        await this.authService.updateVerifyEmail(
            checkIfUserExist.id!,
            0,
            randomCharacters
        );

        const messageDetails: IEmailMessageDetails = {
            receiverEmail: lowerCase(email),
            verifyLink: verificationLink,
            template: "verifyEmail"
        };

        const { exchangeName, routingKey } =
            notificationServiceExchangeNamesAndRoutingKeys.email;
        this.queue.publishDirectMessage(
            exchangeName,
            routingKey,
            JSON.stringify(messageDetails),
            "Verify email message has been sent to notification service."
        );

        const updatedUser = await this.authService.getAuthUserById(
            checkIfUserExist.id!
        );

        return updatedUser;
    }

    async sendForgotPasswordLinkToEmailUser(email: string): Promise<void> {
        const existingUser = await this.authService.getUserByEmail(email);

        if (!existingUser) {
            throw new NotFoundError(
                "Invalid credentials",
                "Password sendForgotPasswordLinkToEmailUser() method error"
            );
        }

        const randomBytes: Buffer = crypto.randomBytes(20);
        const randomCharacters: string = randomBytes.toString("hex");
        const date = new Date();
        date.setHours(date.getHours() + 1);
        await this.authService.updatePasswordToken(
            existingUser.id!,
            randomCharacters,
            date
        );

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
        this.queue.publishDirectMessage(
            exchangeName,
            routingKey,
            JSON.stringify(messageDetails),
            "Forgot password message has been sent to notification service."
        );

        return;
    }

    async resetPassword(token: string, reqBody: any): Promise<void> {
        const { error, value } = resetPasswordSchema.validate(reqBody);

        if (error?.details) {
            throw new BadRequestError(
                error.details[0].message,
                "Password resetPassword() method error"
            );
        }

        const { password, confirmPassword } = value;
        if (password !== confirmPassword) {
            throw new BadRequestError(
                "Passwords not match",
                "Password resetPassword() method error"
            );
        }

        const existingUser =
            await this.authService.getAuthUserByPasswordToken(token);

        if (!existingUser) {
            throw new NotFoundError(
                "Reset token has expired.",
                "Password resetPassword() method error"
            );
        }

        const hashedPassword = await this.authModel.hashPassword(password);
        await this.authService.updatePassword(existingUser.id!, hashedPassword);

        // publish to 2-notification-service > consumeAuthEmailMessages
        const messageDetails: IEmailMessageDetails = {
            username: existingUser.username!,
            receiverEmail: existingUser.email!,
            template: "resetPasswordSuccess"
        };
        const { exchangeName, routingKey } =
            notificationServiceExchangeNamesAndRoutingKeys.email;
        this.queue.publishDirectMessage(
            exchangeName,
            routingKey,
            JSON.stringify(messageDetails),
            "Reset password success message has been sent to notification service."
        );

        return;
    }

    async changePassword(reqBody: any, currUser: IAuthPayload): Promise<void> {
        const { error, value } = changePasswordSchema.validate(reqBody);

        if (error?.details) {
            throw new BadRequestError(
                error.details[0].message,
                "Password changePassword() method error"
            );
        }

        const { currentPassword, newPassword } = value;

        const existingUser = await this.authService.getUserByUsername(
            currUser.username
        );

        if (!existingUser) {
            throw new NotFoundError(
                "User is not found",
                "Password changePassword() method error"
            );
        }

        const isValidPassword: boolean = await this.authModel.comparePassword(
            currentPassword,
            existingUser.password ?? ""
        );

        if (!isValidPassword) {
            throw new BadRequestError(
                "Invalid password.",
                "Password changePassword() method error"
            );
        }

        const hashedPassword = await this.authModel.hashPassword(newPassword);
        await this.authService.updatePassword(existingUser.id!, hashedPassword);

        // publish to 2-notification-service > consumeAuthEmailMessages
        const messageDetails: IEmailMessageDetails = {
            username: existingUser.username!,
            receiverEmail: existingUser.email!,
            template: "resetPasswordSuccess"
        };
        const { exchangeName, routingKey } =
            notificationServiceExchangeNamesAndRoutingKeys.email;
        this.queue.publishDirectMessage(
            exchangeName,
            routingKey,
            JSON.stringify(messageDetails),
            "Password change success message has been sent to notification service."
        );

        return;
    }

    async seedAuthData(count: number): Promise<void> {
        const usernames: string[] = [];

        for (let i = 0; i < count; i++) {
            const name: string = generateUsername("", 0, 12);
            usernames.push(firstLetterUppercase(name));
        }

        for (let i = 0; i < usernames.length; i++) {
            const username = usernames[i];
            const email = faker.internet.email();
            const password = "jobberuser";
            const country = faker.location.country();
            const profilePicture = faker.image.urlPicsumPhotos();

            const checkIfUserExist =
                await this.authService.getUserByUsernameOrEmail(
                    username,
                    email
                );

            if (checkIfUserExist) {
                throw new BadRequestError(
                    "Invalid credentials. Email or Username",
                    "Seed generate() method error"
                );
            }

            const profilePublicId = uuidv4();
            const randomBytes: Buffer = crypto.randomBytes(20);
            const randomCharacters: string = randomBytes.toString("hex");
            const authData: IAuthDocument = {
                username: username,
                email: lowerCase(email),
                profilePublicId,
                password,
                country,
                profilePicture,
                emailVerificationToken: randomCharacters,
                emailVerified: sample([0, 1])
            };

            this.authService.createAuthUser(authData);
        }

        return;
    }
}
