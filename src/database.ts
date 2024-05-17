import { logger, MYSQL_DB } from "@auth/config";
import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(MYSQL_DB!, {
    dialect: "mysql",
    logging: false,
    dialectOptions: {
        multipleStatements: true
    }
});

export async function databaseConnection(): Promise<void> {
    try {
        await sequelize.authenticate();
        logger("database.ts - databaseConnection()").info(
            "AuthService MySQL DB is connected."
        );
    } catch (error) {
        logger("database.ts - databaseConnection()").error(
            "AuthService - Unable to connect to database."
        );
        logger("database.ts - databaseConnection()").log(
            "error",
            "AuthService databaseConnection() method error:",
            error
        );
    }
}
