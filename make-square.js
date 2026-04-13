const Jimp = require('jimp');

Jimp.read('assets/Logo.png')
  .then(image => {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const size = Math.max(width, height);
    
    // Create new square image with transparent background (or white if you prefer)
    // using #FFFFFF for white or 0x00000000 for transparent
    new Jimp(size, size, 0xFFFFFFFF, (err, bg) => {
      if (err) throw err;
      
      const x = (size - width) / 2;
      const y = (size - height) / 2;
      
      bg.composite(image, x, y)
        .write('assets/Logo-square.png', () => {
          console.log('Saved square logo! Size: ' + size + 'x' + size);
        });
    });
  })
  .catch(err => {
    console.error(err);
  });
