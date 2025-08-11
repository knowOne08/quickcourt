const multer = require('multer');
const path = require('path');
const { cloudinary, venueUpload, avatarUpload } = require('../config/cloudinary');
const { ApplicationError } = require('./errorHandler');
const logger = require('../utils/logger');

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApplicationError('Only image files are allowed', 400, 'INVALID_FILE_TYPE'), false);
  }
};

// Memory storage for direct Cloudinary upload
const memoryStorage = multer.memoryStorage();

// General image upload configuration
const imageUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter
});

// Avatar upload middleware
const uploadAvatar = avatarUpload.single('avatar');

// Venue images upload middleware - multiple files
const uploadVenueImages = venueUpload.array('images', 10);

// Single venue image upload
const uploadSingleVenueImage = venueUpload.single('image');

// Generic single image upload
const uploadSingleImage = imageUpload.single('image');

// Multiple images upload
const uploadMultipleImages = imageUpload.array('images', 10);

// Handle avatar upload with error handling
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Avatar file size too large. Maximum size is 2MB.',
            code: 'FILE_TOO_LARGE'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected file field. Use "avatar" field name.',
            code: 'UNEXPECTED_FILE'
          });
        }
      }
      
      logger.error('Avatar upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Avatar upload failed',
        code: 'UPLOAD_ERROR'
      });
    }
    next();
  });
};

// Handle venue images upload with error handling
const handleVenueImagesUpload = (req, res, next) => {
  uploadVenueImages(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'One or more files are too large. Maximum size is 5MB per file.',
            code: 'FILE_TOO_LARGE'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Maximum 10 images allowed.',
            code: 'TOO_MANY_FILES'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected file field. Use "images" field name.',
            code: 'UNEXPECTED_FILE'
          });
        }
      }
      
      logger.error('Venue images upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Images upload failed',
        code: 'UPLOAD_ERROR'
      });
    }
    next();
  });
};

// Upload single image to Cloudinary
const uploadToCloudinary = async (file, folder = 'quickcourt/general') => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      uploadStream.end(file.buffer);
    });
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new ApplicationError('Failed to upload image', 500, 'UPLOAD_FAILED');
  }
};

// Upload multiple images to Cloudinary
const uploadMultipleToCloudinary = async (files, folder = 'quickcourt/general') => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error('Multiple images upload error:', error);
    throw new ApplicationError('Failed to upload one or more images', 500, 'UPLOAD_FAILED');
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok') {
      throw new Error('Cloudinary deletion failed');
    }
    return result;
  } catch (error) {
    logger.error('Cloudinary deletion error:', error);
    throw new ApplicationError('Failed to delete image', 500, 'DELETE_FAILED');
  }
};

// Extract public ID from Cloudinary URL
const extractPublicId = (imageUrl) => {
  try {
    const matches = imageUrl.match(/\/v\d+\/(.+)\./);
    return matches ? matches[1] : null;
  } catch (error) {
    logger.error('Error extracting public ID:', error);
    return null;
  }
};

// Middleware to validate uploaded files
const validateUploadedFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  
  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files were uploaded',
      code: 'NO_FILES'
    });
  }

  // Additional validation can be added here
  for (const file of files) {
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: `File ${file.originalname} is too large`,
        code: 'FILE_TOO_LARGE'
      });
    }

    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: `File ${file.originalname} is not an image`,
        code: 'INVALID_FILE_TYPE'
      });
    }
  }

  next();
};

// Cleanup uploaded files on error
const cleanupUploadedFiles = async (files) => {
  if (!files || files.length === 0) return;

  const deletePromises = files.map(async (file) => {
    if (file.public_id) {
      try {
        await deleteFromCloudinary(file.public_id);
      } catch (error) {
        logger.error('Failed to cleanup uploaded file:', file.public_id, error);
      }
    }
  });

  await Promise.allSettled(deletePromises);
};

module.exports = {
  uploadAvatar,
  uploadVenueImages,
  uploadSingleVenueImage,
  uploadSingleImage,
  uploadMultipleImages,
  handleAvatarUpload,
  handleVenueImagesUpload,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  validateUploadedFiles,
  cleanupUploadedFiles
};
