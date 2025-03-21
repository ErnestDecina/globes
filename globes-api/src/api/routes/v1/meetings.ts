import { Router } from "express";
import MeetingsController from "../../controllers/MeetingsContontroller";

const meetings_router: Router = Router();

meetings_router
    .route('/')
    .get(MeetingsController.getMeetings)
    .post(MeetingsController.postMeetings);

export default meetings_router;