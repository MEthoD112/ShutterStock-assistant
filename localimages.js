const fs = require('fs');
const imghash = require('imghash');
const tress = require('tress');

module.exports.getLocalImagesHashes = function () {
  const results = [];
  const imagesGettingHashesQueueThreadsNumber = 10;
  const now = Date.now();

  fs.readdir('./images', (err, images) => {

    const imagesGettingHashesQueue = tress(function (image, callback) {
      Promise.resolve(imghash.hash('images/' + image))
        .then(hash => {
          callback(null, results.push({ id: image, hash: hash }))
        })
        .catch(err => console.log(err));
    }, imagesGettingHashesQueueThreadsNumber);

    imagesGettingHashesQueue.drain = function () {
      console.log('Hashes of ' + results.length + ' images are got');
      console.log('Executed time: ' + (Date.now() - now));
      fs.writeFileSync('./data/imagesWithHash.json', JSON.stringify(results, null, 4));
    }

    images.forEach(image => imagesGettingHashesQueue.push(image));
  });

  return 'Getting images hashes is executed';
};
require('make-runnable');