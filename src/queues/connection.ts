import { winstonLogger } from "@Akihira77/jobber-shared";
import { ELASTIC_SEARCH_URL, RABBITMQ_ENDPOINT } from "@auth/config";
import client, { Connection, Channel } from "amqplib";
import { Logger } from "winston";

const log: Logger = winstonLogger(
    `${ELASTIC_SEARCH_URL}`,
    "authQueueConnection",
    "debug"
);

export async function createConnection(): Promise<Channel> {
    try {
        const connection: Connection = await client.connect(
            `${RABBITMQ_ENDPOINT}`
        );
        const channel: Channel = await connection.createChannel();
        log.info("Auth server connected to queue successfully...");
        closeConnection(channel, connection);

        return channel;
    } catch (error) {
        log.error("AuthService createConnection() method error:", error);
        process.exit(1);
    }
}

function closeConnection(channel: Channel, connection: Connection): void {
    process.once("SIGINT", async () => {
        await channel.close();
        await connection.close();
    });
}
