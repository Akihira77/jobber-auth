import { IAuthDocument, IAuthPayload } from "@Akihira77/jobber-shared";
import { Response } from "express";

export const authMockRequest = (
    sessionData: IJWT,
    body: IAuthMock,
    currentUser?: IAuthPayload | null,
    params?: unknown
) => {
    return {
        session: sessionData,
        body,
        params,
        currentUser
    };
};

export const authMockResponse = (): Response => {
    const res: Response = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
};

export interface IJWT {
    jwt?: string;
}

export interface IAuthMock {
    id?: number;
    username?: string;
    email?: string;
    password?: string;
    createdAt?: Date | string;
}

export const authUserPayload: IAuthPayload = {
    id: 1,
    username: "Dika",
    email: "dika@test.com",
    iat: 12312321
};

export const authMock = {
    id: 1,
    profilePublicId: "1231232131232112",
    username: "Dika",
    email: "dika@test.com",
    country: "Indonesia",
    profilePicture: "",
    emailVerified: 1,
    createdAt: new Date(),
    comparePassword: () => {},
    hashPassword: () => false
} as unknown as IAuthDocument;
