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
        const results = [];  
        previews.forEach(preview => {
         const dist = hamming(image.hash, preview.hash);

        if (dist <= 20) {
            results.push({ localImage: image.id, preview: preview.id, dist: dist });
        }
        });
        results.sort((a, b) => a.dist - b.dist);
        compareResults.push(results[0]);
      });
    console.log('Executed time: ' + (Date.now() - now));
    fs.writeFileSync('./data/compare.json', JSON.stringify(compareResults, null, 4));
    });
  });
  return 'Comparing images and previews hashes is executed!!!';
};
require('make-runnable');
