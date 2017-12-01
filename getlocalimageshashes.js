const fs = require('fs');
const imghash = require('imghash');
const tress = require('tress');
const _ = require('lodash');
const Jimp = require('jimp');
const now = Date.now();

function fullFillImagesGettingHashesQueue(images, imagesGettingHashesQueue) {
  if (!images.length) console.log('Hashes of all local images were got!!!');
  images.forEach(image => imagesGettingHashesQueue.push(image));
}

function sortResults(localImagesResults) {
  localImagesResults.sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}

function resolveHash(image, hash, localImagesResults) {
  localImagesResults.push({ id: image, hash: hash })
  console.log('Hashes got: ' + localImagesResults.length);
}

function rejectHash(image, err, errorResults) {
  console.log('Hash error ' + err + 'Image: ' + image)
  errorResults.push({ id: image.id, err: err });
}

function getImageHash(Image, callback, localImagesResults, errorResults) {
  Jimp.read(Image).then((image) => {
    callback(null, resolveHash(Image, image.hash(), localImagesResults));
  }).catch((err) => {
    callback(null, rejectHash(Image, err, errorResults))
  });

  // Promise.resolve(imghash.hash(image))
  //   .then(hash => {
  //     callback(null, resolveHash(image, hash, localImagesResults))
  //   })
  //   .catch(err => callback(null, rejectHash(image, err, errorResults)));
}

function createLocalImagesHashesQueue(images) {
  const imagesGettingHashesQueueThreadsNumber = 10;
  let localImagesResults = [], errorResults = [];

  const imagesGettingHashesQueue = tress((image, callback) => {
    getImageHash(image, callback, localImagesResults, errorResults);
  }, imagesGettingHashesQueueThreadsNumber);

  imagesGettingHashesQueue.drain = function () {
    fs.readFile('./data/imagesWithHash.json', 'utf8', (err, data) => {
      const imagesWithHash = data ? JSON.parse(data) : [];
      console.log('Hashes of ' + imagesWithHash.length + ' images have been already got');
      console.log('Hashes of ' + localImagesResults.length + ' images are getting now');
      localImagesResults.push(...imagesWithHash);
      console.log('Hashes of ' + localImagesResults.length + ' images are got total');
      console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds');
      sortResults(localImagesResults);
      fs.writeFileSync('./data/imagesWithHash.json', JSON.stringify(localImagesResults, null, 4));
    });
  };

  fullFillImagesGettingHashesQueue(images, imagesGettingHashesQueue);
}

module.exports.getLocalImagesHashes = function () {
  fs.readFile('./data/imagesDiff.json', 'utf8', (err, data) => {
    const imagesPathes = data ? JSON.parse(data) : [];
    createLocalImagesHashesQueue(imagesPathes);
  });
  return 'Getting images hashes is executed!!!';
};
require('make-runnable');