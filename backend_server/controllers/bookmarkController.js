const Bookmark = require('../models/bookmarkModel');

exports.getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id }).sort({ bookmarkedAt: -1 });
    res.status(200).json(bookmarks);
  } catch (err) {
    console.error("Error in getBookmarks:", err);
    res.status(500).json({ message: "Error fetching bookmarks.", error: err.message });
  }
};

exports.addBookmark = async (req, res) => {
  const { schemeId } = req.body;
  const userId = req.user.id;

  if (!schemeId) {
    return res.status(400).json({ message: "Scheme ID is required." });
  }

  try {
    const existing = await Bookmark.findOne({ user: userId, schemeId });
    if (existing) {
      return res.status(409).json({ message: 'Scheme is already bookmarked.' });
    }

    const newBookmark = new Bookmark({ user: userId, schemeId });
    await newBookmark.save();

    res.status(201).json(newBookmark);

  } catch (err) {
    console.error("Error in addBookmark:", err);
    res.status(500).json({ message: "Error adding bookmark.", error: err.message });
  }
};

exports.removeBookmark = async (req, res) => {
  const { schemeId } = req.params;
  const userId = req.user.id;

  try {
    const deletedBookmark = await Bookmark.findOneAndDelete({ user: userId, schemeId: schemeId });

    if (!deletedBookmark) {
      return res.status(404).json({ message: "Bookmark not found." });
    }

    res.status(200).json({ message: 'Bookmark removed successfully.' });

  } catch (err) {
    console.error("Error in removeBookmark:", err);
    res.status(500).json({ message: "Error removing bookmark.", error: err.message });
  }
};