import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const baseDir = process.env.UPLOAD_PATH || './uploads';
    let subDir = 'others';

    if (file.fieldname.includes('avatar') || file.fieldname.includes('profile')) {
      subDir = 'avatars';
    } else if (file.fieldname.includes('floorPlan') || file.fieldname.includes('sketchup')) {
      subDir = 'floorplans';
    } else if (file.fieldname.includes('diary') || file.fieldname.includes('image') || file.fieldname.includes('photo')) {
      subDir = 'diaries';
    } else if (file.fieldname.includes('portfolio') || file.fieldname.includes('qualification')) {
      subDir = 'designers';
    } else if (file.fieldname.includes('contract') || file.fieldname.includes('acceptance')) {
      subDir = 'documents';
    } else if (file.fieldname.includes('evidence') || file.fieldname.includes('invoice')) {
      subDir = 'evidence';
    }

    const fullDir = path.join(baseDir, subDir);
    ensureDirExists(fullDir);
    cb(null, fullDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const sketchupTypes = /skp$/;
  const documentTypes = /pdf|doc|docx/;
  const allTypes = /jpeg|jpg|png|gif|webp|skp|pdf|doc|docx/;

  const extname = allTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allTypes.test(file.mimetype) || 
    file.mimetype === 'application/octet-stream' ||
    file.mimetype === 'application/pdf' ||
    file.mimetype.includes('word');

  if (extname || mimetype) {
    return cb(null, true);
  }

  cb(new Error('不支持的文件格式，仅支持 JPG、PNG、GIF、WEBP、SKP、PDF、DOC、DOCX'));
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE || '52428800', 10);

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxSize
  }
});

export default upload;
