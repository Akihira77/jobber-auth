import { cloudinaryConfig } from "@auth/config";
import express, { Express } from "express";
import { start } from "@auth/server";
import { databaseConnection } from "@auth/database";

function initialize(): void {
    cloudinaryConfig();
    const app: Express = express();
    databaseConnection();
    start(app);
}

initialize();
