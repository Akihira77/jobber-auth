import {
    BadRequestError,
    IAuthDocument,
    isEmail
} from "@Akihira77/jobber-shared";
import { AuthModel } from "@auth/models/auth.model";
import { signInSchema } from "@auth/schemas/signin";
import {
    getUserByEmail,
    getUserByUsername,
    signToken
} from "@auth/services/auth.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { omit } from "lodash";

export async function signIn(
    req: Request<never, never, { username: string; password: string }, never>,
    res: Response
): Promise<void> {
    const { error } = await Promise.resolve(signInSchema.validate(req.body));

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "signIn signIn() method error"
        );
    }

    const { username, password } = req.body;
    const isValidEmail = isEmail(username);
    const existingUser: IAuthDocument = isValidEmail
        ? await getUserByEmail(username)
        : await getUserByUsername(username);

    if (!existingUser) {
        throw new BadRequestError(
            "Invalid credentials",
            "signIn signIn() method error"
        );
    }

    const passwordMatch = await AuthModel.prototype.comparePassword(
        password,
        existingUser.password!
    );

    if (!passwordMatch) {
        throw new BadRequestError(
            "Invalid credentials",
            "signIn signIn() method error"
        );
    }

    const userJWT = signToken(
        existingUser.id!,
        existingUser.email!,
        existingUser.username!
    );
    const userData: IAuthDocument = omit(existingUser, ["password"]);

    res.status(StatusCodes.OK).json({
        message: "User sign in successfully",
        user: userData,
        token: userJWT
    });
}
