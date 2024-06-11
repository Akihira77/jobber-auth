import { Logger } from "winston"
import jwt from "jsonwebtoken"
import { Context, Hono, Next } from "hono"
import { StatusCodes } from "http-status-codes"
import { NotAuthorizedError } from "@Akihira77/jobber-shared"

import { AuthQueue } from "@auth/queues/auth.queue"
import { AuthService } from "@auth/services/auth.service"
import { UnauthSearchService } from "@auth/services/search.service"
import { ElasticSearchClient } from "@auth/elasticsearch"
import { AuthHandler } from "@auth/handler/auth.handler"
import { GATEWAY_JWT_TOKEN } from "@auth/config"

// const BASE_PATH = "/api/v1/auth";
const BASE_PATH = "/auth"

export function appRoutes(
    app: Hono,
    queue: AuthQueue,
    elastic: ElasticSearchClient,
    logger: (moduleName: string) => Logger
): void {
    app.get("auth-health", (c: Context) => {
        return c.text("Auth service is healthy and OK.", StatusCodes.OK)
    })

    const authSvc = new AuthService(queue, logger)
    const unauthSvc = new UnauthSearchService(elastic, logger)
    const authHndlr = new AuthHandler(queue, authSvc, unauthSvc)

    const api = app.basePath(BASE_PATH)

    api.put("/seed/:count", (c: Context) => {
        const count = c.req.param("count")
        authHndlr.seedAuthData(parseInt(count, 10))

        return c.json(
            {
                message: "Seed users created successfully",
                total: count
            },
            StatusCodes.CREATED
        )
    })

    searchRoute(api, authHndlr)

    // api.use(verifyGatewayRequest);
    authRoute(api, authHndlr)
    api.use(verifyGatewayRequest)
}

function searchRoute(
    api: Hono<Record<string, never>, Record<string, never>, typeof BASE_PATH>,
    authHndlr: AuthHandler
): void {
    api.get("/search/gig/:from/:size/:type", async (c: Context) => {
        const { from, size, type } = c.req.param()
        const { query, delivery_time, min, max } = c.req.query()

        const { resultHits, total } = await authHndlr.gigsQuerySearch.bind(
            authHndlr
        )(
            { from, type, size: parseInt(size, 10) },
            query,
            delivery_time,
            parseInt(min, 10),
            parseInt(max, 10)
        )

        return c.json(
            {
                message: "Search gigs results",
                total: total,
                gigs: resultHits
            },
            StatusCodes.OK
        )
    })

    api.get("/search/gig/:id", async (c: Context) => {
        const id = c.req.param("id")
        const gig = await authHndlr.getSingleGigById.bind(authHndlr)(id)

        if (!gig) {
            return c.json(
                { message: "Single gig result", gig: {} },
                StatusCodes.NOT_FOUND
            )
        }

        return c.json({ message: "Single gig result", gig }, StatusCodes.OK)
    })
}

function authRoute(
    api: Hono<Record<string, never>, Record<string, never>, typeof BASE_PATH>,
    authHndlr: AuthHandler
): void {
    api.get("/current-user", async (c: Context) => {
        const currUser = c.get("currentUser")
        const user = await authHndlr.getCurrentUser.bind(authHndlr)(currUser)

        return c.json(
            {
                message: "Authenticated user",
                user
            },
            StatusCodes.OK
        )
    })

    api.get("/refresh-token/:username", async (c: Context) => {
        const username = c.req.param("username")
        const { userJWT, user } =
            await authHndlr.getRefreshToken.bind(authHndlr)(username)

        return c.json(
            {
                message: "Refresh token generated",
                user,
                token: userJWT
            },
            StatusCodes.OK
        )
    })

    api.post("/resend-verification-email", async (c: Context) => {
        const { email } = await c.req.json()
        const user =
            await authHndlr.resendVerificationEmail.bind(authHndlr)(email)

        return c.json(
            {
                message: "Email verification has been sent",
                user
            },
            StatusCodes.OK
        )
    })

    api.post("/signup", async (c: Context) => {
        const jsonBody = await c.req.json()
        const { user, token } = await authHndlr.signUp.bind(authHndlr)(jsonBody)

        return c.json(
            {
                message: "User created successfully",
                user,
                token
            },
            StatusCodes.CREATED
        )
    })

    api.post("/signin", async (c: Context) => {
        const jsonBody = await c.req.json()
        const { user, token } = await authHndlr.signIn.bind(authHndlr)(jsonBody)

        return c.json(
            {
                message: "User sign in successfully",
                user,
                token
            },
            StatusCodes.OK
        )
    })

    api.put("/verify-email", async (c: Context) => {
        const { email } = await c.req.json()
        const user = await authHndlr.verifyEmail.bind(authHndlr)(email)

        return c.json(
            {
                message: "Email verified successfully.",
                user
            },
            StatusCodes.OK
        )
    })

    api.put("/forgot-password", async (c: Context) => {
        const { email } = await c.req.json()
        await authHndlr.sendForgotPasswordLinkToEmailUser.bind(authHndlr)(email)

        return c.json(
            {
                message: "Password reset password has been sent."
            },
            StatusCodes.OK
        )
    })

    api.put("/reset-password/:token", async (c: Context) => {
        const token = c.req.param("token")
        const jsonBody = await c.req.json()
        await authHndlr.resetPassword.bind(authHndlr)(token, jsonBody)

        return c.json(
            {
                message: "Password successfully updated."
            },
            StatusCodes.OK
        )
    })

    api.put("/change-password", async (c: Context) => {
        const jsonBody = await c.req.json()
        const currUser = c.get("currentUser")
        authHndlr.changePassword.bind(authHndlr)(jsonBody, currUser)

        return c.json(
            {
                message: "Password successfully updated."
            },
            StatusCodes.OK
        )
    })
}

async function verifyGatewayRequest(c: Context, next: Next): Promise<void> {
    const token = c.req.header("gatewayToken")
    if (!token) {
        throw new NotAuthorizedError(
            "Invalid request",
            "verifyGatewayRequest() method: Request not coming from api gateway"
        )
    }

    try {
        const payload: { id: string; iat: number } = jwt.verify(
            token,
            GATEWAY_JWT_TOKEN!
        ) as {
            id: string
            iat: number
        }

        c.set("gatewayToken", payload)
        await next()
    } catch (error) {
        throw new NotAuthorizedError(
            "Invalid request",
            "verifyGatewayRequest() method: Request not coming from api gateway"
        )
    }
}
