const fs = require('fs');
const imghash = require('imghash');
const tress = require('tress');

module.exports.getLocalImagesHashes = function () {
  const localImagesresults = [];
  const imagesGettingHashesQueueThreadsNumber = 10;
  const now = Date.now();

  fs.readdir('./images', (err, images) => {

    const imagesGettingHashesQueue = tress(function (image, callback) {
      Promise.resolve(imghash.hash('images/' + image))
        .then(hash => {
          callback(null, localImagesresults.push({ id: image, hash: hash }))
        })
        .catch(err => callback(null, console.log('Hash error ' + err + 'Image id: ' + image.id)));
    }, imagesGettingHashesQueueThreadsNumber);

    imagesGettingHashesQueue.drain = function () {
      console.log('Hashes of ' + localImagesresults.length + ' images are got');
      console.log('Executed time: ' + (Date.now() - now));
      localImagesresults.sort((a, b) => {
        if (a.id < b.id)
          return -1;
        if (a.id > b.id)
          return 1;
        return 0;
      });
      fs.writeFileSync('./data/imagesWithHash.json', JSON.stringify(localImagesresults, null, 4));
    }

    images.forEach(image => imagesGettingHashesQueue.push(image));
  });

  return 'Getting images hashes is executed!!!';
};
require('make-runnable');