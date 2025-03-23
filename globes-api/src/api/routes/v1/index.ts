import { Router } from "express";
import meetings_router from "./meetings";

const express_router: Router = Router();

express_router.use('/meetings', meetings_router);
express_router.use('/openai', meetings_router);


export default express_router;