
import * as dotenv from 'dotenv';
dotenv.config();

const database_config = {
    host: "db",
    database: "database",
    username: "c21394933",
    password: "postgres",
    port:  5432,
    dialect: 'postgres',
    isLogging: true
}

export default database_config;