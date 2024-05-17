import { NotFoundError } from "@Akihira77/jobber-shared";
import { getUserByUsername, signToken } from "@auth/services/auth.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function getRefreshToken(
    req: Request,
    res: Response
): Promise<void> {
    const existingUser = await getUserByUsername(req.params.username);

    if (!existingUser) {
        throw new NotFoundError(
            "User is not found.",
            "Password resetPassword() method error"
        );
    }

    const userJWT: string = signToken(
        existingUser.id!,
        existingUser.email!,
        existingUser.username!
    );

    res.status(StatusCodes.OK).json({
        message: "Refresh token generated",
        user: existingUser,
        token: userJWT
    });
}
