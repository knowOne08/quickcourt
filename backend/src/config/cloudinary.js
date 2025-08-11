const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage configuration for venue images
const venueStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'quickcourt/venues',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  }
});

// Storage configuration for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'quickcourt/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  }
});

// Multer configurations
const venueUpload = multer({
  storage: venueStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Helper functions
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error('Failed to delete image');
  }
};

const getImagePublicId = (imageUrl) => {
  const matches = imageUrl.match(/\/v\d+\/(.+)\./);
  return matches ? matches[1] : null;
};

module.exports = {
  cloudinary,
  venueUpload,
  avatarUpload,
  deleteImage,
  getImagePublicId
};
