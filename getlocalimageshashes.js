const fs = require('fs');
const imghash = require('imghash');
const tress = require('tress');
const _ = require('lodash');

let localImagesResults = [];
const now = Date.now();

function drain() {
  console.log('Hashes of ' + imagesWithHash.length + ' images have been already got');
  console.log('Hashes of ' + localImagesResults.length + ' images are getting now');
  localImagesResults = localImagesResults.concat(imagesWithHash);
  console.log('Hashes of ' + localImagesResults.length + ' images are got total');
  console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds');
  localImagesResults.sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
  fs.writeFileSync('./data/imagesWithHash.json', JSON.stringify(localImagesResults, null, 4));
}

function fullFillImagesGettingHashesQueue(images, imagesGettingHashesQueue) {
  fs.readFile('./data/imagesWithHash.json', 'utf8', (err, data) => {
    const imagesWithHash = data ? JSON.parse(data) : [];
    imagesWithHash.forEach(imageWithHash => _.remove(images, (image) => image === imageWithHash.id));
    if (!images.length) console.log('Hashes of all local images were got!!!');
    images.forEach(image => imagesGettingHashesQueue.push(image));
  });
}

function resolveHash(image, hash) {
  localImagesResults.push({ id: image, hash: hash })
}

function rejectHash(image, err) {
  console.log('Hash error ' + err + 'Image id: ' + image.id)
}

function getImageHash(image, callback) {
  Promise.resolve(imghash.hash('images/' + image))
    .then(hash => {
      callback(null, resolveHash(image, hash))
    })
    .catch(err => callback(null, rejectHash(image, err)));
}

function createLocalImagesHashesQueue(images) {
  const imagesGettingHashesQueueThreadsNumber = 10;
  const imagesGettingHashesQueue = tress((image, callback) => {
    getImageHash(image, callback);
  }, imagesGettingHashesQueueThreadsNumber);

  imagesGettingHashesQueue.drain = drain;

  fullFillImagesGettingHashesQueue(images, imagesGettingHashesQueue);
}

module.exports.getLocalImagesHashes = function () {
  fs.readFile('./data/imagesDiff.json', (err, images) => {
    createLocalImagesHashesQueue(images);    
  });
  return 'Getting images hashes is executed!!!';
};
require('make-runnable');