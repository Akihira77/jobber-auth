import { MYSQL_DB } from "@auth/config";
import { Sequelize } from "sequelize";
import { Logger } from "winston";

export let sequelize: Sequelize = new Sequelize(MYSQL_DB!, {
    dialect: "mysql",
    logging: false,
    dialectOptions: {
        multipleStatements: true
    }
});

export async function databaseConnection(
    logger: (moduleName: string) => Logger
): Promise<Sequelize> {
    try {
        await sequelize.authenticate();
        return sequelize;
    } catch (error) {
        logger("database.ts - databaseConnection()").error(
            "AuthService - Unable to connect to database."
        );
        logger("database.ts - databaseConnection()").log(
            "error",
            "AuthService databaseConnection() method error:",
            error
        );

        throw error;
    }
}
