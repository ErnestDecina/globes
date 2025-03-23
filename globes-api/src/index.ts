import Logger from "./utils/logger";
import { createExpressServer } from "./server";
import { application_name, is_development } from "./config/application.config";
import { express_port, api_version } from "./config/express.config";
import { DatabasePostgres } from "./database";
import { openAI } from "./utils/openai";
import sync from "./database/sync";

DatabasePostgres;
openAI;
const express_server = createExpressServer();

express_server.listen(express_port, () => {
    Logger.info(`Application "${application_name}" with API version ${api_version}`);
    Logger.info(`App is listening on  http://localhost:${express_port}/`);
});