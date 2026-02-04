/**
 * UserProfile Model
 * Stores LinkedIn profile analysis data
 */

const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    linkedinUrl: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    rawApifyData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    profileScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    issues: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userProfileSchema.index({ linkedinUrl: 1, createdAt: -1 });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
