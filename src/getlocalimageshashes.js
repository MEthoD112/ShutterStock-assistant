const fs = require('fs-then');
const imghash = require('imghash');
const tress = require('tress');
const _ = require('lodash');

function fullFillImagesGettingHashesQueue(images, imagesGettingHashesQueue, resolve) {
  if (!images.length) resolve(console.log('Hashes of all local images were got!!!'));
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
  localImagesResults.push({ path: image, hash: hash })
  console.log('Hashes got: ' + localImagesResults.length);
}

function rejectHash(image, err, errorResults) {
  console.log('Hash error ' + err + 'Image: ' + image)
  errorResults.push({ path: image.id, err: err });
}

function getImageHash(image, callback, localImagesResults, errorResults) {
  Promise.resolve(imghash.hash(image))
    .then(hash => {
      callback(null, resolveHash(image, hash, localImagesResults))
    })
    .catch(err => callback(null, rejectHash(image, err, errorResults)));
}

function getImagesHashes(images, resolve, now) {
  let localImagesResults = [], errorResults = [];

  const imagesGettingHashesQueue = tress((image, callback) => {
    getImageHash(image, callback, localImagesResults, errorResults);
  }, 10);

  imagesGettingHashesQueue.drain = function () {
    fs.readFile('./data/imagesWithHash.json', 'utf8')
      .then(data => {
        const imagesWithHash = data ? JSON.parse(data) : [];
        console.log('Hashes of ' + imagesWithHash.length + ' images have been already got');
        console.log('Hashes of ' + localImagesResults.length + ' images are getting now');
        localImagesResults.push(...imagesWithHash);
        console.log('Hashes of ' + localImagesResults.length + ' images are got total');
        sortResults(localImagesResults);
        fs.writeFileSync('./data/imagesWithHash.json', JSON.stringify(localImagesResults, null, 4))
        resolve(console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds'));
      }, err => console.error(err));
  };

  fullFillImagesGettingHashesQueue(images, imagesGettingHashesQueue, resolve);
}

module.exports = function () {
  const now = Date.now();
  console.log('Getting images hashes is executed!!!');
  return new Promise((resolve, reject) => {
    fs.readFile('./data/imagesDiff.json', 'utf8')
      .then(data => {
        const imagesPathes = data ? JSON.parse(data) : [];
        getImagesHashes(imagesPathes, resolve, now);
      }, err => reject(console.error(err)));
  });
};
