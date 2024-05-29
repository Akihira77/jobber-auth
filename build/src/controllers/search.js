"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleGigById = exports.gigsQuerySearch = void 0;
const search_service_1 = require("../services/search.service");
const http_status_codes_1 = require("http-status-codes");
const lodash_1 = require("lodash");
function gigsQuerySearch(req, res) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const { from, size, type } = req.params;
        let resultHits = [];
        const paginate = {
            from,
            size: parseInt(size),
            type
        };
        const { query, delivery_time, min, max } = req.query;
        const gigs = yield (0, search_service_1.gigsSearch)((_a = query === null || query === void 0 ? void 0 : query.toString()) !== null && _a !== void 0 ? _a : "", paginate, parseInt((_b = min === null || min === void 0 ? void 0 : min.toString()) !== null && _b !== void 0 ? _b : "0"), parseInt((_c = max === null || max === void 0 ? void 0 : max.toString()) !== null && _c !== void 0 ? _c : "999"), delivery_time === null || delivery_time === void 0 ? void 0 : delivery_time.toString());
        for (const item of gigs.hits) {
            resultHits.push(item._source);
        }
        if (type === "backward") {
            resultHits = (0, lodash_1.sortBy)(resultHits, ["sortId"]);
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Search gigs results",
            total: gigs.total,
            gigs: resultHits
        });
    });
}
exports.gigsQuerySearch = gigsQuerySearch;
function singleGigById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const gig = yield (0, search_service_1.getGigById)("gigs", req.params.id);
        res.status(http_status_codes_1.StatusCodes.OK).json({ message: "Single gig result", gig });
    });
}
exports.singleGigById = singleGigById;
//# sourceMappingURL=search.js.map