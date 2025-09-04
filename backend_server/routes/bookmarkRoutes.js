const express = require('express');
const router = express.Router();
const { getBookmarks, addBookmark, removeBookmark } = require('../controllers/bookmarkController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getBookmarks);
router.post('/', addBookmark);
router.delete('/:schemeId', removeBookmark);

module.exports = router;