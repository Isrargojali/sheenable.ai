const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sheenableai/avatars',
    allowed_formats: ['jpeg', 'png', 'webp', 'jpg'],
  },
});

const cvStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sheenableai/cvs',
    allowed_formats: ['pdf', 'doc', 'docx'],
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
});

const uploadCv = multer({
  storage: cvStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = {
  uploadAvatar,
  uploadCv,
};

