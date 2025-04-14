import multer from "multer";
import path from "path";
import fs from "fs";
import { Express } from "multer";
import Logger from "../logger";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Extract meeting_uuid from request params
    const meeting_uuid = req.params.meeting_uuid;
    const language = req.query.lang;

    Logger.info(`Meeting uuid: ${meeting_uuid}, Lang: ${language}`);

    // Create a specific directory for this meeting
    const uploadDir = path.join("/workspace/globes-api", "uploads", "meetings", meeting_uuid, language);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const language = req.query.lang;
    cb(null, "slide-" + language + path.extname(file.originalname));
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check file types
  const allowedFileTypes = [
    "application/pdf", // PDF
    "application/vnd.ms-powerpoint", // PPT (older format)
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX (newer format)
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and PowerPoint files are allowed"));
  }
};

export const uploadSlides = (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => {
  // Initialize multer with our configured storage and file filter
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }).single("slides"); // 'slides' is the field name for the file

  // Handle the upload
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    // If successful, continue to the next middleware
    next();
  });
};
