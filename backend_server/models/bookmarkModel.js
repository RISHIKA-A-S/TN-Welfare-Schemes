const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schemeId: {
    type: String, 
    required: true
  },
  bookmarkedAt: {
    type: Date,
    default: Date.now
  }
});

bookmarkSchema.index({ user: 1, schemeId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);