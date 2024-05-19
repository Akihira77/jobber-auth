import http from "http";
import "express-async-errors";

import compression from "compression";
import jwt from "jsonwebtoken";
import {
    CustomError,
    IAuthPayload,
    IErrorResponse
} from "@Akihira77/jobber-shared";
import { API_GATEWAY_URL, JWT_TOKEN, logger, PORT } from "@auth/config";
import {
    Application,
    NextFunction,
    Request,
    Response,
    json,
    urlencoded
} from "express";
import hpp from "hpp";
import helmet from "helmet";
import cors from "cors";
import { checkConnection, createIndex } from "@auth/elasticsearch";
import { appRoutes } from "@auth/routes";
import { Channel } from "amqplib";
import { createConnection } from "@auth/queues/connection";
import morgan from "morgan";

export let authChannel: Channel;

export function start(app: Application): void {
    securityMiddleware(app);
    standardMiddleware(app);
    routesMiddleware(app);
    startQueues();
    startElasticSearch();
    authErrorHandler(app);
    startServer(app);
}

function securityMiddleware(app: Application): void {
    app.set("trust proxy", 1);
    app.use(hpp());
    app.use(helmet());
    app.use(
        cors({
            origin: [`${API_GATEWAY_URL}`],
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        })
    );

    app.use((req: Request, _res: Response, next: NextFunction) => {
        // console.logger(req.headers);
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const payload = jwt.verify(token, JWT_TOKEN!) as IAuthPayload;

            req.currentUser = payload;
        }
        next();
    });
}

function standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: "200mb" }));
    app.use(urlencoded({ extended: true, limit: "200mb" }));
    app.use(morgan("dev"))
}

function routesMiddleware(app: Application): void {
    appRoutes(app);
}

async function startQueues(): Promise<void> {
    authChannel = (await createConnection()) as Channel;
}

export function startElasticSearch(): void {
    checkConnection();
    createIndex("gigs");
}

function authErrorHandler(app: Application): void {
    app.use(
        (
            error: IErrorResponse,
            _req: Request,
            res: Response,
            next: NextFunction
        ) => {
            logger("server.ts - authErrorHandler()").error(
                `AuthService ${error.comingFrom}:`,
                error
            );

            if (error instanceof CustomError) {
                res.status(error.statusCode).json(error.serializeErrors());
            }
            next();
        }
    );
}

function startServer(app: Application): void {
    try {
        const httpServer: http.Server = new http.Server(app);
        logger("server.ts - startServer()").info(
            `AuthService has started with pid ${process.pid}`
        );
        httpServer.listen(Number(PORT), () => {
            logger("server.ts - startServer()").info(
                `AuthService running on port ${PORT}`
            );
        });
    } catch (error) {
        logger("server.ts - startServer()").error(
            "AuthService startServer() method error:",
            error
        );
    }
}
