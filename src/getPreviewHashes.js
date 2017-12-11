const fs = require('fs-then');
const imghash = require('imghash');
const tress = require('tress');
const _ = require('lodash');

function fullFillPreviewsGettingHashesQueue(previews, previewsGettingHashesQueue, resolve) {
  if (!previews.length) resolve(console.log('Hashes of all previews were got!!!'));
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
  Promise.resolve(imghash.hash('previews/' + preview.id + '.jpg'))
    .then(hash => {
      callback(null, resolveHash(preview, hash, hashResults))
    })
    .catch(err => callback(null, rejectHash(preview, err, errorResults)));
}

function getPreviewsHashes(previews, resolve, now) {
  let hashResults = [], errorResults = [];

  const previewsGettingHashesQueue = tress((preview, callback) => {
    getPreviewHash(preview, callback, hashResults, errorResults);
  }, 10);

  previewsGettingHashesQueue.drain = function () {
    fs.readFile('./data/previewsWithHash.json', 'utf8')
      .then(data => {
        const previewsWithHash = data ? JSON.parse(data) : [];
        console.log('Hashes of ' + previewsWithHash.length + ' previews have been already got');
        console.log('Hashes of ' + hashResults.length + ' previews are getting now');
        hashResults.push(...previewsWithHash);
        console.log('Hashes of ' + hashResults.length + ' previews are got total');
        writeResultsToJson('./data/previewsWithHash.json', hashResults);
        fs.readFile('./data/previewsWithHashErr.json', 'utf8')
        .then(errors => {
          const previousErrors = errors ? JSON.parse(errors) : [];
          previousErrors.push(...errorResults);
          writeResultsToJson('./data/previewsWithHashErr.json', previousErrors);
          resolve(console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds'));
        }, err => console.error(err));  
      }, err => console.error(err));
  }

  fullFillPreviewsGettingHashesQueue(previews, previewsGettingHashesQueue, resolve);
}

module.exports = function () {
  const now = Date.now();
  console.log('Getting previews hashes is executed!!!');
  return new Promise((resolve, reject) => {
    fs.readFile('./data/previewsLinksDiff.json', 'utf8')
      .then(previewLinks => {
        const previews = previewLinks ? JSON.parse(previewLinks) : [];
        getPreviewsHashes(previews, resolve, now);
      }, err => reject(console.error(err)));
  });
};
