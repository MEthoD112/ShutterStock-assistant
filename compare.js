const fs = require('fs');
const hamming = require('hamming-distance');

module.exports.compare = function () {
  const now = Date.now();
  const compareResults = [];

  fs.readFile('./data/previewsWithHash.json', 'utf8', function (err, data) {
    const previews = JSON.parse(data);
    fs.readFile('./data/imagesWithHash.json', 'utf8', function (err, data) {
      const images = JSON.parse(data);

      images.forEach(image => {
        previews.forEach(preview => {
         const dist = hamming(image.hash, preview.hash);

        if (dist <= 8) {
            compareResults.push({ localImage: image.id, preview: preview.id, dist: dist });
        }
      });
    });
    console.log('Executed time: ' + (Date.now() - now));
    fs.writeFileSync('./data/compare.json', JSON.stringify(compareResults, null, 4));
    });
  });
  return 'Comparing images and previews hashes is executed!!!';
};
require('make-runnable');
