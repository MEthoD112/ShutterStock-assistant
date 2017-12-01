const fs = require('fs');
const imghash = require('imghash');
const tress = require('tress');
const _ = require('lodash');
const Jimp = require('jimp');
const now = Date.now();

function fullFillPreviewsGettingHashesQueue(previews, previewsGettingHashesQueue) {
  if (!previews.length) console.log('Hashes of all previews were got!!!');
  previews.forEach(preview => previewsGettingHashesQueue.push(preview));
}

function writeResultsToJson(url, results) {
  fs.writeFileSync(url, JSON.stringify(results, null, 4));
}

function resolveHash(preview, hash, hashResults) {
  hashResults.push({ id: preview.id, imageUrl: preview.imageUrl, hash: hash });
  console.log('Hashes got: ' + hashResults.length);
}

function rejectHash(preview, err, errorResults) {
  console.log('Hash error: ' + err + '  FileName: ' + preview.id);
  errorResults.push({ id: preview.id, err: err });
}

function getPreviewHash(preview, callback, hashResults, errorResults) {
  Jimp.read('previews/' + preview.id + '.jpg').then((image) => {
    callback(null, resolveHash(preview, image.hash(), hashResults));
  }).catch((err) => {
    callback(null, rejectHash(preview, err, errorResults))
  });

  // Promise.resolve(imghash.hash('previews/' + preview.id + '.jpg'))
  //   .then(hash => {
  //     callback(null, resolveHash(preview, hash, hashResults))
  //   })
  //   .catch(err => callback(null, rejectHash(preview, err, errorResults)));
}

function createPreviewsGettingHashesQueue(previews) {
  const previewsGettingHashesQueueThreadsNumber = 10;
  let hashResults = [], errorResults = [];

  const previewsGettingHashesQueue = tress((preview, callback) => {
    getPreviewHash(preview, callback, hashResults, errorResults);
  }, previewsGettingHashesQueueThreadsNumber);

  previewsGettingHashesQueue.drain = function() {
    fs.readFile('./data/previewsWithHash.json', 'utf8', (err, data) => {
      const previewsWithHash = data ? JSON.parse(data) : [];
      console.log('Hashes of ' + previewsWithHash.length + ' previews have been already got');
      console.log('Hashes of ' + hashResults.length + ' previews are getting now');
      hashResults.push(...previewsWithHash);
      console.log('Hashes of ' + hashResults.length + ' previews are got total');
      console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds');
      writeResultsToJson('./data/previewsWithHash.json', hashResults);
    });
    writeResultsToJson('./data/previewsWithHashErr.json', errorResults);
  }

  fullFillPreviewsGettingHashesQueue(previews, previewsGettingHashesQueue);
}

module.exports.getPreviewsHashes = function () {
  fs.readFile('./data/previewsLinksDiff.json', 'utf8', (err, previewLinks) => {
    const previews = previewLinks ? JSON.parse(previewLinks) : [];
    createPreviewsGettingHashesQueue(previews);
  });
  return 'Getting previews hashes is executed!!!';
};
require('make-runnable');
