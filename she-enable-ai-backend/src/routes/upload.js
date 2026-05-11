const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { uploadAvatar, uploadCV, uploadLogo } = require('../controllers/uploadController');

// Cloudinary upload middleware - only applied if cloudinary is configured
const getUploadMiddleware = (folder, type = 'image') => {
  try {
    const cloudinary = require('../config/cloudinary');
    const multer = require('multer');
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    const storage = new CloudinaryStorage({ cloudinary, params: { folder: `sheenableai/${folder}`, resource_type: type === 'pdf' ? 'raw' : 'image' } });
    return multer({ storage, limits: { fileSize: type === 'pdf' ? 10 * 1024 * 1024 : 3 * 1024 * 1024 } });
  } catch {
    const multer = require('multer');
    return multer({ storage: multer.memoryStorage() });
  }
};

router.put('/avatar', protect, getUploadMiddleware('avatars').single('avatar'), uploadAvatar);
router.put('/cv', protect, authorizeRoles('CANDIDATE'), getUploadMiddleware('cvs', 'pdf').single('cv'), uploadCV);
router.put('/logo', protect, authorizeRoles('EMPLOYER'), getUploadMiddleware('logos').single('logo'), uploadLogo);

module.exports = router;
