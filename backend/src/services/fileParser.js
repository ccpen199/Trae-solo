const fs = require('fs');
const path = require('path');

const parseTextFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error('Failed to parse text file');
  }
};

const parseFile = (filePath, originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  
  const textExtensions = ['.txt', '.md', '.json', '.xml', '.csv', '.log', '.sql'];
  const codeExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.h', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.css', '.html', '.vue', '.jsx', '.tsx'];
  
  if (textExtensions.includes(ext) || codeExtensions.includes(ext)) {
    return {
      content: parseTextFile(filePath),
      type: codeExtensions.includes(ext) ? 'code' : 'text'
    };
  }
  
  throw new Error(`Unsupported file format: ${ext}`);
};

const isSupportedFormat = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  const supported = ['.txt', '.md', '.json', '.xml', '.csv', '.log', '.sql', 
                     '.js', '.ts', '.py', '.java', '.cpp', '.c', '.h', '.go', 
                     '.rs', '.php', '.rb', '.swift', '.kt', '.css', '.html', 
                     '.vue', '.jsx', '.tsx'];
  return supported.includes(ext);
};

module.exports = {
  parseFile,
  parseTextFile,
  isSupportedFormat
};
