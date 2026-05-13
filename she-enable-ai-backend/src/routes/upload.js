const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { uploadAvatarFile, uploadCvDocument } = require('../controllers/uploadController');
const { uploadAvatar, uploadCv } = require('../middleware/upload');

router.use(protect);

router.post('/avatar', uploadAvatar.single('avatar'), uploadAvatarFile);
router.post('/cv', authorize('CANDIDATE'), uploadCv.single('cv'), uploadCvDocument);

module.exports = router;
