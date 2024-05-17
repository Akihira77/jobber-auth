import { Client } from "@elastic/elasticsearch";
import { ISellerGig } from "@Akihira77/jobber-shared";
import {
    ClusterHealthResponse,
    GetResponse
} from "@elastic/elasticsearch/lib/api/types";
import { ELASTIC_SEARCH_URL, logger } from "@auth/config";

export const elasticSearchClient = new Client({
    node: `${ELASTIC_SEARCH_URL}`
});

export async function checkConnection(): Promise<void> {
    let isConnected = false;
    while (!isConnected) {
        logger("elasticsearch.ts - checkConnection()").info(
            "AuthService connecting to Elasticsearch..."
        );
        try {
            const health: ClusterHealthResponse =
                await elasticSearchClient.cluster.health({});

            logger("elasticsearch.ts - checkConnection()").info(
                `AuthService Elasticsearch health status - ${health.status}`
            );
            isConnected = true;
        } catch (error) {
            logger("elasticsearch.ts - checkConnection()").error(
                "Connection to Elasticsearch failed. Retrying..."
            );
            logger("elasticsearch.ts - checkConnection()").error(
                "AuthService checkConnection() method error:",
                error
            );
        }
    }
}

export async function checkExistingIndex(indexName: string): Promise<boolean> {
    const result: boolean = await elasticSearchClient.indices.exists({
        index: indexName
    });

    return result;
}

export async function createIndex(indexName: string): Promise<void> {
    try {
        const existingIndex: boolean = await checkExistingIndex(indexName);
        if (existingIndex) {
            logger("elasticsearch.ts - createIndex()").info(
                `Index ${indexName} already exist in Elasticsearch.`
            );
        } else {
            await elasticSearchClient.indices.create({ index: indexName });

            // refreshing document
            // so we can access the document right after creating an index
            await elasticSearchClient.indices.refresh({ index: indexName });

            logger("elasticsearch.ts - createIndex()").info(
                `Created index ${indexName} in Elasticsearch`
            );
        }
    } catch (error) {
        logger("elasticsearch.ts - createIndex()").error(
            `An error occured while creating the index ${indexName}`
        );
        logger("elasticsearch.ts - createIndex()").error(
            "AuthService createIndex() method error:",
            error
        );
    }
}

export async function getDocumentById(
    index: string,
    id: string
): Promise<ISellerGig> {
    try {
        const result: GetResponse = await elasticSearchClient.get({
            index,
            id
        });

        return result._source as ISellerGig;
    } catch (error) {
        logger("elasticsearch.ts - getDocumentById()").error(
            "AuthService getDocumentById() method error:",
            error
        );
        return {} as ISellerGig;
    }
}
