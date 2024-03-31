import {
    IHitsTotal,
    IPaginateProps,
    IQueryList,
    ISearchResult,
    ISellerGig,
    winstonLogger
} from "@Akihira77/jobber-shared";
import { ELASTIC_SEARCH_URL } from "@auth/config";
import { elasticSearchClient, getDocumentById } from "@auth/elasticsearch";
import { SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import { Logger } from "winston";

const log: Logger = winstonLogger(
    `${ELASTIC_SEARCH_URL}`,
    "authServiceServer",
    "debug"
);

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

    try {
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
    } catch (error) {
        log.error("AuthService gigsSearch() method error:", error);
        return { total: 0, hits: [] };
    }
}
