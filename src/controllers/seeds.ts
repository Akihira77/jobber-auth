import crypto from "crypto";

import {
    BadRequestError,
    IAuthDocument,
    firstLetterUppercase,
    lowerCase
} from "@Akihira77/jobber-shared";
import {
    createAuthUser,
    getUserByUsernameOrEmail
} from "@auth/services/auth.service";
import { faker } from "@faker-js/faker";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { generateUsername } from "unique-username-generator";
import { v4 as uuidv4 } from "uuid";
import { sample } from "lodash";

export async function generate(req: Request, res: Response): Promise<void> {
    const { count } = req.params;
    const usernames: string[] = [];

    for (let i = 0; i < parseInt(count, 10); i++) {
        const name: string = generateUsername("", 0, 12);
        usernames.push(firstLetterUppercase(name));
    }

    for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i];
        const email = faker.internet.email();
        const password = "jobberuser";
        const country = faker.location.country();
        const profilePicture = faker.image.urlPicsumPhotos();

        const checkIfUserExist = await getUserByUsernameOrEmail(
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

        createAuthUser(authData);
    }

    res.status(StatusCodes.OK).json({
        message: "Seed users created successfully",
        total: count
    });
}
