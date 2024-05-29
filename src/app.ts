import express, { Express } from "express";
import { start } from "@auth/server";
import { databaseConnection, sequelize } from "@auth/database";
import cloudinary from "cloudinary";
import { winstonLogger } from "@Akihira77/jobber-shared";
import { Logger } from "winston";

import {
    CLOUD_API_KEY,
    CLOUD_API_SECRET,
    CLOUD_NAME,
    ELASTIC_SEARCH_URL
} from "./config";

async function main(): Promise<void> {
    const logger = (moduleName?: string): Logger =>
        winstonLogger(
            `${ELASTIC_SEARCH_URL}`,
            moduleName ?? "Auth Service",
            "debug"
        );
    try {
        cloudinary.v2.config({
            cloud_name: CLOUD_NAME,
            api_key: CLOUD_API_KEY,
            api_secret: CLOUD_API_SECRET
        });

        const app: Express = express();
        await databaseConnection(logger);
        await start(app, logger);
    } catch (error) {
        process.exit(1);
    }

    process.once("exit", async () => {
        await sequelize.connectionManager.close();
    });
}

main();
