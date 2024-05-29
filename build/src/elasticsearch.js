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
exports.getDocumentById = exports.createIndex = exports.checkExistingIndex = exports.checkConnection = exports.elasticSearchClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const config_1 = require("./config");
exports.elasticSearchClient = new elasticsearch_1.Client({
    node: `${config_1.ELASTIC_SEARCH_URL}`
});
function checkConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        let isConnected = false;
        while (!isConnected) {
            (0, config_1.logger)("elasticsearch.ts - checkConnection()").info("AuthService connecting to Elasticsearch...");
            try {
                const health = yield exports.elasticSearchClient.cluster.health({});
                (0, config_1.logger)("elasticsearch.ts - checkConnection()").info(`AuthService Elasticsearch health status - ${health.status}`);
                isConnected = true;
            }
            catch (error) {
                (0, config_1.logger)("elasticsearch.ts - checkConnection()").error("Connection to Elasticsearch failed. Retrying...");
                (0, config_1.logger)("elasticsearch.ts - checkConnection()").error("AuthService checkConnection() method error:", error);
            }
        }
    });
}
exports.checkConnection = checkConnection;
function checkExistingIndex(indexName) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield exports.elasticSearchClient.indices.exists({
            index: indexName
        });
        return result;
    });
}
exports.checkExistingIndex = checkExistingIndex;
function createIndex(indexName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existingIndex = yield checkExistingIndex(indexName);
            if (existingIndex) {
                (0, config_1.logger)("elasticsearch.ts - createIndex()").info(`Index ${indexName} already exist in Elasticsearch.`);
            }
            else {
                yield exports.elasticSearchClient.indices.create({ index: indexName });
                // refreshing document
                // so we can access the document right after creating an index
                yield exports.elasticSearchClient.indices.refresh({ index: indexName });
                (0, config_1.logger)("elasticsearch.ts - createIndex()").info(`Created index ${indexName} in Elasticsearch`);
            }
        }
        catch (error) {
            (0, config_1.logger)("elasticsearch.ts - createIndex()").error(`An error occured while creating the index ${indexName}`);
            (0, config_1.logger)("elasticsearch.ts - createIndex()").error("AuthService createIndex() method error:", error);
        }
    });
}
exports.createIndex = createIndex;
function getDocumentById(index, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield exports.elasticSearchClient.get({
                index,
                id
            });
            return result._source;
        }
        catch (error) {
            (0, config_1.logger)("elasticsearch.ts - getDocumentById()").error("AuthService getDocumentById() method error:", error);
            return {};
        }
    });
}
exports.getDocumentById = getDocumentById;
//# sourceMappingURL=elasticsearch.js.map