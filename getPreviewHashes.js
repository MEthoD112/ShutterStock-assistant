const fs = require('fs');
const imghash = require('imghash');
const tress = require('tress');
const _ = require('lodash');

const now = Date.now();
let hashResults = [], errorResults = [];

function drain() {
  fs.readFile('./data/previewsWithHash.json', 'utf8', (err, data) => {
    const previewsWithHash = data ? JSON.parse(data) : [];
    console.log('Hashes of ' + previewsWithHash.length + ' previews have been already got');
    console.log('Hashes of ' + hashResults.length + ' previews are getting now');
    hashResults = hashResults.concat(previewsWithHash);
    console.log('Hashes of ' + hashResults.length + ' previews are got total');
    console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds');
    fs.writeFileSync('./data/previewsWithHash.json', JSON.stringify(hashResults, null, 4));
  });
  fs.writeFileSync('./data/previewsWithHashErr.json', JSON.stringify(errorResults, null, 4));
}

function fullFillPreviewsGettingHashesQueue(previews, previewsGettingHashesQueue) {
  if (!previews.length) console.log('Hashes of all previews were got!!!');
  previews.forEach(preview => previewsGettingHashesQueue.push(preview));
}

function resolveHash(preview, hash) {
  hashResults.push({ id: preview.id, imageUrl: preview.imageUrl, hash: hash });
  console.log('Hashes got: ' + hashResults.length);
}

function rejectHash(preview, err) {
  console.log('Hash error: ' + err + '  FileName: ' + preview.id);
  errorResults.push({ id: preview.id, err: err });
}

function getPreviewHash(preview, callback) {
  Promise.resolve(imghash.hash('previews/' + preview.id + '.jpg'))
    .then(hash => {
      callback(null, resolveHash(preview, hash))
    })
    .catch(err => callback(null, rejectHash(preview, err)));
}

function createPreviewGettingHashesQueue(previews) {
  const previewsGettingHashesQueueThreadsNumber = 10;

  const previewsGettingHashesQueue = tress((preview, callback) => {
    getPreviewHash(preview, callback);
  }, previewsGettingHashesQueueThreadsNumber);

  previewsGettingHashesQueue.drain = drain

  fullFillPreviewsGettingHashesQueue(previews, previewsGettingHashesQueue);
}

module.exports.getPreviewsHashes = function () {
  fs.readFile('./data/previewsLinksDiff.json', 'utf8', (err, previewLinks) => {
    const previews = previewLinks ? JSON.parse(previewLinks) : [];
    createPreviewGettingHashesQueue(previews);
  });
  return 'Getting previews hashes is executed!!!';
};
require('make-runnable');
