import { Router } from "express";
import MeetingsController from "../../controllers/MeetingsContontroller";

const meetings_router: Router = Router();

meetings_router
    .get('/:uuid', MeetingsController.getMeetings);

meetings_router
    .route('/')
    .post(MeetingsController.postMeetings);

export default meetings_router;