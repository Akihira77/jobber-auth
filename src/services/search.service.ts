import {
    IHitsTotal,
    IPaginateProps,
    IQueryList,
    ISearchResult,
    ISellerGig
} from "@Akihira77/jobber-shared";
import { elasticSearchClient, getDocumentById } from "@auth/elasticsearch";
import { SearchResponse } from "@elastic/elasticsearch/lib/api/types";

export async function getGigById(
    index: string,
    id: string
): Promise<ISellerGig> {
    const gig = await getDocumentById(index, id);

    return gig;
}

export async function gigsSearch(
    searchQuery: string,
    paginate: IPaginateProps,
    deliveryTime?: string,
    min?: number,
    max?: number
): Promise<ISearchResult> {
    const { from, size, type } = paginate;
    // try it on elasticsearch dev tools
    const queryList: IQueryList[] = [
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

    if (!deliveryTime) {
        queryList.push({
            query_string: {
                fields: ["expectedDelivery"],
                query: `*${deliveryTime}*`
            }
        });
    }

    if (!isNaN(parseInt(`${min}`)) && !isNaN(parseInt(`${max}`))) {
        queryList.push({
            range: {
                price: {
                    gte: min,
                    lte: max
                }
            }
        });
    }

    const result: SearchResponse = await elasticSearchClient.search({
        index: "gigs",
        size,
        query: {
            bool: {
                must: queryList
            }
        },
        sort: [
            {
                sortId: type === "forward" ? "asc" : "desc"
            }
        ],
        // startFrom for pagination
        ...(from !== "0" && { search_after: [from] })
    });

    const total: IHitsTotal = result.hits.total as IHitsTotal;
    const hits = result.hits.hits;

    return { total: total.value, hits };
}
