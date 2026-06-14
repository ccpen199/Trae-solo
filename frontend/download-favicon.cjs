const https = require('https');
const fs = require('fs');
const path = require('path');

const downloadImage = (url, outputPath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(outputPath);
      });
    }).on('error', reject);
  });
};

const generateFavicons = async () => {
  const publicDir = '/Users/chen/Documents/trae_projects/local_projects/may-89083/frontend/public';
  
  const prompt = encodeURIComponent('modern minimalist home renovation logo, blue gradient, house icon, clean design, app icon style, square, white background');
  
  const urls = [
    { url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square`, name: 'favicon-192.png' }
  ];
  
  for (const item of urls) {
    try {
      const outputPath = path.join(publicDir, item.name);
      console.log(`Downloading ${item.name}...`);
      await downloadImage(item.url, outputPath);
      console.log(`Saved ${item.name}`);
    } catch (err) {
      console.error(`Failed to download ${item.name}:`, err.message);
    }
  }
  
  console.log('Done!');
};

generateFavicons();
