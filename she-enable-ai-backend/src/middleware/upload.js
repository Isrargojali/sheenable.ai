const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── AVATAR STORAGE (images only, 2MB max) ───────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'sheenableai/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
    public_id: (req) => `avatar_${req.user._id}_${Date.now()}`,
  },
});

const avatarFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed for avatar upload.'), false);
};

// ─── RESUME / CV STORAGE (PDF/DOC only, 5MB max) ─────────────────────────────
const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'sheenableai/resumes',
    allowed_formats: ['pdf', 'doc', 'docx'],
    resource_type:   'raw',
    public_id: (req) => `resume_${req.user._id}_${Date.now()}`,
  },
});

const resumeFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only PDF or Word documents are allowed for resume upload.'), false);
};

// ─── Multer instances ─────────────────────────────────────────────────────────
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { uploadAvatar, uploadResume, cloudinary };
