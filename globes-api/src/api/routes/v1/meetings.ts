import { Router } from "express";
import MeetingsController from "../../controllers/MeetingsContontroller";

const meetings_router: Router = Router();

meetings_router
    .route('/')
    .get(MeetingsController.getMeetings);

export default meetings_router;