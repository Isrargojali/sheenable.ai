const mongoose = require('mongoose');

const BlogArticleSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  slug:       { type: String, required: true, unique: true, index: true },
  content:    { type: String, required: true },
  excerpt:    { type: String, required: true },
  category:   { type: String, enum: ['CAREER_ADVICE', 'COMPANY_BLOG', 'DEI_RESEARCH'], required: true, index: true },
  author: {
    name:      { type: String, required: true },
    role:      { type: String },
    avatarUrl: { type: String }
  },
  coverUrl:   { type: String },
  readTime:   { type: Number, default: 5 },
  tags:       [{ type: String, index: true }],
  isFeatured: { type: Boolean, default: false, index: true }
}, { timestamps: true });

BlogArticleSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

module.exports = mongoose.model('BlogArticle', BlogArticleSchema);
