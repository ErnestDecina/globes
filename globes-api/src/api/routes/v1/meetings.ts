import { Router } from "express";
import MeetingsController from "../../controllers/MeetingsContontroller";

const meetings_router: Router = Router();

meetings_router
    .get('/:uuid', MeetingsController.getMeetings);

meetings_router
    .route('/')
    .post(MeetingsController.postMeetings);

meetings_router
    .route('/:uuid/messages')
    .post(MeetingsController.postMessage)
    .get(MeetingsController.getMessages);



export default meetings_router;