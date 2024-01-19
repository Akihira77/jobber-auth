import { winstonLogger } from "@Akihira77/jobber-shared";
import { Logger } from "winston";
import { ELASTIC_SEARCH_URL, cloudinaryConfig } from "@auth/config";
import express, { Express } from "express";
import { start } from "@auth/server";
import { databaseConnection } from "@auth/database";

const log: Logger = winstonLogger(
    `${ELASTIC_SEARCH_URL}`,
    "authenticationServiceApp",
    "debug"
);

function initialize(): void {
    cloudinaryConfig();
    const app: Express = express();
    databaseConnection();
    start(app);
    log.info("Authentication Service Initialize");
}

initialize();
