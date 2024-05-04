import { startElasticSearch } from "@auth/server"
import { gigsSearch } from "../search.service";

describe("Read / Get Gig", () => {
    beforeAll(async () => {
        startElasticSearch();
    })

    describe("gigsSearch() method", () => {
        it("founds some data", async () => {
            const { total, hits } = await gigsSearch("website", { from: "0", size: 10, type: "forward" }, "", 0, 20);

            expect(total).not.toBe(0);
            expect(hits).not.toEqual([]);
        })
    })
})
