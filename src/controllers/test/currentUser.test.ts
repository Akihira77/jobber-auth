import { Request, Response } from "express";
import * as auth from "@auth/services/auth.service";
import {
    authMock,
    authMockRequest,
    authMockResponse,
    authUserPayload
} from "@auth/controllers/test/mocks/auth.mock";
import {
    getCurrentUser,
    resendVerificationEmail
} from "@auth/controllers/currentUser";
import * as helper from "@Akihira77/jobber-shared";

jest.mock("@auth/services/auth.service");
jest.mock("@Akihira77/jobber-shared");
jest.mock("@auth/queues/auth.producer");
jest.mock("@elastic/elasticsearch");

const USERNAME = "Dika";
const PASSWORD = "dika1";

describe("CurrentUser", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getCurrentUser() method", () => {
        it("should return authenticated user", async () => {
            const req: Request = authMockRequest(
                {},
                { username: USERNAME, password: PASSWORD },
                authUserPayload
            ) as unknown as Request;
            const res: Response = authMockResponse();

            jest.spyOn(auth, "getAuthUserById").mockResolvedValue(authMock);
            await getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Authenticated user",
                user: authMock
            });
        });

        it("should return empty user", async () => {
            const req: Request = authMockRequest(
                {},
                { username: USERNAME, password: PASSWORD },
                authUserPayload
            ) as unknown as Request;
            const res: Response = authMockResponse();

            jest.spyOn(auth, "getAuthUserById").mockResolvedValue({} as never);
            await getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Authenticated user",
                user: null
            });
        });
    });

    describe("resendVerificationEmail() method", () => {
        it("should call BadRequestError for invalid email", async () => {
            const req: Request = authMockRequest(
                {} as never,
                { email: USERNAME },
                authUserPayload
            ) as unknown as Request;
            const res: Response = authMockResponse();

            jest.spyOn(auth, "getUserByEmail").mockResolvedValue({} as never);

            resendVerificationEmail(req, res).catch(() => {
                expect(helper.BadRequestError).toHaveBeenCalledWith(
                    "Email is invalid",
                    "currentUser resendVerificationEmail() method error"
                );
            });
        });

        it("should call updateVerifyEmail() method", async () => {
            const req: Request = authMockRequest(
                {} as never,
                { email: USERNAME },
                authUserPayload
            ) as unknown as Request;
            const res: Response = authMockResponse();

            jest.spyOn(auth, "getUserByEmail").mockResolvedValue(authMock);

            await resendVerificationEmail(req, res);

            expect(auth.updateVerifyEmail).toHaveBeenCalled();
        });

        it("should call getAuthUserById() method", async () => {
            const req: Request = authMockRequest(
                {} as never,
                { email: USERNAME },
                authUserPayload
            ) as unknown as Request;
            const res: Response = authMockResponse();

            jest.spyOn(auth, "getUserByEmail").mockResolvedValue(authMock);
            jest.spyOn(auth, "getAuthUserById").mockResolvedValue(authMock);

            await resendVerificationEmail(req, res);

            expect(auth.updateVerifyEmail).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Email verification has been sent",
                user: authMock
            });
        });
    });
});
