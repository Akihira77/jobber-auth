"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRoutes = void 0;
const search_1 = require("../controllers/search");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
function searchRoutes() {
    router.get("/search/gig/:from/:size/:type", search_1.gigsQuerySearch);
    router.get("/search/gig/:id", search_1.singleGigById);
    return router;
}
exports.searchRoutes = searchRoutes;
//# sourceMappingURL=search.route.js.map