import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ["video/mp4", "video/mpeg", "video/quicktime"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only MP4, MPEG, and QuickTime video files are allowed."));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

export default upload;