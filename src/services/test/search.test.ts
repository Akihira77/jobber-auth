import { startElasticSearch } from "@auth/server";

import { gigsSearch } from "../search.service";

beforeAll(async () => {
    startElasticSearch();
});

describe("search.service.ts - gigsSearch() method", () => {
    it("Must returning data", async () => {
        const { total, hits } = await gigsSearch(
            "website",
            { from: "0", size: 10, type: "forward" },
            0,
            20,
            ""
        );

        expect(total).not.toBe(0);
        expect(hits).not.toEqual([]);
    });
});
