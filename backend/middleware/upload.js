const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ErrorResponse = require('../utils/ErrorResponse');

const uploadDir = process.env.FILE_UPLOAD_PATH || './uploads';
['resumes', 'avatars', 'logos'].forEach((sub) => {
  const dir = path.join(uploadDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = 'misc';
    if (file.fieldname === 'resume') sub = 'resumes';
    else if (file.fieldname === 'avatar') sub = 'avatars';
    else if (file.fieldname === 'logo' || file.fieldname === 'coverImage')
      sub = 'logos';
    cb(null, path.join(uploadDir, sub));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${req.user ? req.user._id : 'anon'}-${Date.now()}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new ErrorResponse('Resume must be a PDF or Word document', 400));
    }
  } else {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new ErrorResponse('Image must be JPG, PNG, or WEBP', 400));
    }
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: Number(process.env.MAX_FILE_UPLOAD) || 5000000 },
});

module.exports = upload;
