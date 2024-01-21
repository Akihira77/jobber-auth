import { generate } from "@auth/controllers/seeds";
import express, { Router } from "express";

const router: Router = express.Router();

export function seedRoutes(): Router {
    router.put("/seed/:count", generate);

    return router;
}
