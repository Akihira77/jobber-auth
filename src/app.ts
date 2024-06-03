import { start } from "@auth/server";
import { databaseConnection } from "@auth/database";
import cloudinary from "cloudinary";
import { winstonLogger } from "@Akihira77/jobber-shared";
import { Logger } from "winston";
import { Hono } from "hono";

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

        const app = new Hono();
        const db = await databaseConnection(logger);

        logger("app.ts - main()").info(
            "AuthService MySQL Database is connected."
        );
        await start(app, logger);

        process.once("exit", async () => {
            await db.connectionManager.close();
        });
    } catch (error) {
        logger("app.ts - main()").error(error);
        process.exit(1);
    }
}

main();
