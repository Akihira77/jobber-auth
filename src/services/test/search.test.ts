import { winstonLogger } from "@Akihira77/jobber-shared";
import { ELASTIC_SEARCH_URL } from "@auth/config";
import { ElasticSearchClient } from "@auth/elasticsearch";

import { UnauthSearchService } from "../search.service";

let unauthSearch: UnauthSearchService;
beforeAll(async () => {
    const logger = (moduleName?: string) =>
        winstonLogger(
            `${ELASTIC_SEARCH_URL}`,
            moduleName ?? "AuthService",
            "debug"
        );
    const elastic = new ElasticSearchClient(logger);
    unauthSearch = new UnauthSearchService(elastic, logger);
});

describe("search.service.ts - gigsSearch() method", () => {
    it("Should return all data match with function parameters", async () => {
        const { total, hits } = await unauthSearch.gigsSearch(
            "web",
            { from: "0", size: 5, type: "forward" },
            0,
            100,
            "5 Days Delivery" // Expected Delivery
        );

        expect(total).not.toBe(0);
        expect(hits.length).toBeLessThanOrEqual(5);

        for (let i = 0; i < hits.length; i++) {
            const gig = hits[i]._source as any;
            expect(gig.expectedDelivery).toBe("5 Days Delivery");
            expect(gig.price).toBeGreaterThanOrEqual(0);
            expect(gig.price).toBeLessThanOrEqual(100);
        }
    });
});
