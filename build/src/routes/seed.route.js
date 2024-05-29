"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedRoutes = void 0;
const seeds_1 = require("../controllers/seeds");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
function seedRoutes() {
    router.put("/seed/:count", seeds_1.generate);
    return router;
}
exports.seedRoutes = seedRoutes;
//# sourceMappingURL=seed.route.js.map