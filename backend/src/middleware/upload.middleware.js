const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const videoTypes = /video\/(mp4|webm|ogg|quicktime)/;
  const imageTypes = /image\/(jpeg|png|gif|webp)/;
  
  if (videoTypes.test(file.mimetype) || imageTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持视频和图片文件'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

module.exports = upload;
