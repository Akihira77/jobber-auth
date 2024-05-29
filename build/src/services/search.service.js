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
exports.gigsSearch = exports.getGigById = void 0;
const config_1 = require("../config");
const elasticsearch_1 = require("../elasticsearch");
function getGigById(index, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const gig = yield (0, elasticsearch_1.getDocumentById)(index, id);
        return gig;
    });
}
exports.getGigById = getGigById;
function gigsSearch(searchQuery, paginate, min, max, deliveryTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const { from, size, type } = paginate;
        // try it on elasticsearch dev tools
        const queryList = [
            {
                query_string: {
                    fields: [
                        "username",
                        "title",
                        "description",
                        "basicDescription",
                        "basicTitle",
                        "categories",
                        "subCategories",
                        "tags"
                    ],
                    query: `*${searchQuery}*`
                }
            },
            {
                term: {
                    active: true
                }
            }
        ];
        if (deliveryTime && deliveryTime != "undefined") {
            queryList.push({
                query_string: {
                    fields: ["expectedDelivery"],
                    query: `*${deliveryTime}*`
                }
            });
        }
        if (!isNaN(min) && !isNaN(max)) {
            queryList.push({
                range: {
                    price: {
                        gte: min,
                        lte: max
                    }
                }
            });
        }
        try {
            const result = yield elasticsearch_1.elasticSearchClient.search(Object.assign({ index: "gigs", size, query: {
                    bool: {
                        must: queryList
                    }
                }, sort: [
                    {
                        sortId: type === "forward" ? "asc" : "desc"
                    }
                ] }, (from !== "0" && { search_after: [from] })));
            const total = result.hits.total;
            const hits = result.hits.hits;
            return { total: total.value, hits };
        }
        catch (error) {
            (0, config_1.logger)("services/search.service.ts - gigsSearch()").error("AuthService gigsSearch() method error:", error);
            return { total: 0, hits: [] };
        }
    });
}
exports.gigsSearch = gigsSearch;
//# sourceMappingURL=search.service.js.map