import { Channel } from "amqplib";
import { createConnection } from "@auth/queues/connection";
import { logger } from "@auth/config";

export async function publishDirectMessage(
    channel: Channel,
    exchangeName: string,
    routingKey: string,
    message: string, // Stringify first before send to this function
    logMessage: string
): Promise<void> {
    try {
        if (!channel) {
            channel = (await createConnection()) as Channel;
        }

        await channel.assertExchange(exchangeName, "direct");
        channel.publish(exchangeName, routingKey, Buffer.from(message));

        logger("queues/auth.producer.ts - publishDirectMessage()").info(
            logMessage
        );
    } catch (error) {
        logger("queues/auth.producer.ts - publishDirectMessage()").error(
            "AuthService Provider publishDirectMessage() method error:",
            error
        );
    }
}
