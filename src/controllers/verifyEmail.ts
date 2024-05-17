import { BadRequestError } from "@Akihira77/jobber-shared";
import {
    getAuthUserById,
    getAuthUserByVerificationToken,
    updateVerifyEmail
} from "@auth/services/auth.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function verifyEmail(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.body;
        const checkIfUserExist = await getAuthUserByVerificationToken(token);
        if (!checkIfUserExist) {
            throw new BadRequestError(
                "Verification token is either invalid or already used.",
                "verifyEmail verifyEmail() method error"
            );
        }

        await updateVerifyEmail(checkIfUserExist.id!, 1);
        const updatedUser = await getAuthUserById(checkIfUserExist.id!);

        res.status(StatusCodes.OK).json({
            message: "Email verified successfully.",
            user: updatedUser
        });
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
