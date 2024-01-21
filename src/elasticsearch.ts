import { Client } from "@elastic/elasticsearch";
import { Logger } from "winston";
import { ISellerGig, winstonLogger } from "@Akihira77/jobber-shared";
import {
    ClusterHealthResponse,
    GetResponse
} from "@elastic/elasticsearch/lib/api/types";
import { ELASTIC_SEARCH_URL } from "@auth/config";

const log: Logger = winstonLogger(
    `${ELASTIC_SEARCH_URL}`,
    "authElasticSearchServer",
    "debug"
);

export const elasticSearchClient = new Client({
    node: ELASTIC_SEARCH_URL
});

export async function checkConnection(): Promise<void> {
    let isConnected = false;
    while (!isConnected) {
        log.info("AuthService connecting to Elasticsearch...");
        try {
            const health: ClusterHealthResponse =
                await elasticSearchClient.cluster.health({});

            log.info(
                `AuthService Elasticsearch health status - ${health.status}`
            );
            isConnected = true;
        } catch (error) {
            log.error("Connection to Elasticsearch failed. Retrying...");
            log.error("AuthService checkConnection() method error:", error);
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
            log.info(`Index ${indexName} already exist.`);
        } else {
            await elasticSearchClient.indices.create({ index: indexName });

            // refreshing document
            // so we can access the document right after creating an index
            await elasticSearchClient.indices.refresh({ index: indexName });

            log.info(`Created index ${indexName}`);
        }
    } catch (error) {
        log.error(`An error occured while creating the index ${indexName}`);
        log.error("AuthService createIndex() method error:", error);
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
        log.error("AuthService getDocumentById() method error:", error);
        return {} as ISellerGig;
    }
}
