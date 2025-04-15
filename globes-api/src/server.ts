import express from 'express';
import { Application } from 'express';
import cors from 'cors';


import { is_development } from './config/application.config';
import { api_version } from './config/express.config';
import express_router from './api/routes/v1';
import Logger from './utils/logger';
import path from 'path';


export function createExpressServer(): Application {
    const express_app = express();

    const cors_option = {
        origin: '*',
        credentials: true
    };

    express_app.use(express.urlencoded({extended: false}));
    express_app.use(express.json());
    express_app.use(cors(cors_option));
    express_app.use('/static', express.static('/workspace/globes-api/uploads'));


    // Routes
    express_app.use(`/api/${api_version}`, express_router);

    // Development Enviroment
    if(is_development) {
        Logger.debug('Development Enviroment Active');
    }

    return express_app;
}