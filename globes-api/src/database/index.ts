import { Sequelize, Dialect } from "sequelize";
import database_config from "../config/database.config";
import Logger from "../utils/logger";

function customLog(message: string) {
    Logger.debug(message);
} 

export const DatabasePostgres: Sequelize = new Sequelize(
    {
        host:       database_config.host,
        database:   database_config.database,
        username:   database_config.username,
        password:   database_config.password,
        port:       database_config.port,
        dialect:    database_config.dialect as Dialect,
        logging:    database_config.isLogging ? customLog : false
    }
);