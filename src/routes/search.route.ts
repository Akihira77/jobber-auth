import { gigsQuerySearch, singleGigById } from "@auth/controllers/search";
import express, { Router } from "express";

const router: Router = express.Router();

export function searchRoutes(): Router {
    router.get("/search/gig/:from/:size/:type", gigsQuerySearch);
    router.get("/search/gig/:id", singleGigById);

    return router;
}
