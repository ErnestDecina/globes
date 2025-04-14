import { Router } from "express";
import MeetingsController from "../../controllers/MeetingsContontroller";
import { uploadSlides } from "../../../utils/multer";

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

meetings_router
    .route('/:meeting_uuid/translations/:message_uuid')
    .get(MeetingsController.getTranslation);

meetings_router
    .route('/:meeting_uuid/translations')
    .get(MeetingsController.getTranslations);

meetings_router
    .route('/:meeting_uuid/slides')
    .post(uploadSlides, MeetingsController.handleFileUploadResponse);




export default meetings_router;