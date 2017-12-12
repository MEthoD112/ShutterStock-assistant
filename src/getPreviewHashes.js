const imghash = require('imghash');
const logger = require('./logger');
const utils = require('./utils');

let hashResults = [], errorResults = [];

function handleHashed(preview, hash) {
  hashResults.push({ id: preview.id, imageUrl: preview.imageUrl, hash: hash });
  logger.log('Hashes got: ' + hashResults.length);
}

function handleError(preview, err) {
  logger.log('Hash error: ' + err + '  FileName: ' + preview.id);
  errorResults.push({ id: preview.id, err: err });
}

function getPreviewHash(preview, callback) {
  Promise.resolve(imghash.hash('previews/' + preview.id + '.jpg'))
    .then(hash => {
      callback(null, handleHashed(preview, hash))
    })
    .catch(err => callback(null, handleError(preview, err)));
}

function getPreviewsHashes(previewsLinks) {
  const previews = utils.parseArrayData(previewsLinks);
  return utils.handleInQueue(previews, getPreviewHash, 10);
}

module.exports = () => {
  const now = Date.now();
  logger.log('Getting previews hashes is executed!!!');
  return new Promise((resolve, reject) => {
    utils.readFile('./data/previewsLinksDiff.json')
      .then(getPreviewsHashes)
      .then(() => utils.readFile('./data/previewsWithHashErr.json'))
      .then(previewsErr => {
        const previousErrors = utils.parseArrayData(previewsErr);
        logger.log('Hash errors of ' + previousErrors.length + ' previews have been already got');
        logger.log('Hash errors of ' + errorResults.length + ' previews are getting now');
        previousErrors.push(...errorResults);
        logger.log('Hash errors of ' + previousErrors.length + ' previews are got total');
        utils.writeToFileSync('./data/previewsWithHashErr.json', previousErrors);
        return utils.readFile('./data/previewsWithHash.json');
      })
      .then(previews => {
        const previewsWithHash = utils.parseArrayData(previews);
        logger.log('Hashes of ' + previewsWithHash.length + ' previews have been already got');
        logger.log('Hashes of ' + hashResults.length + ' previews are getting now');
        hashResults.push(...previewsWithHash);
        logger.log('Hashes of ' + hashResults.length + ' previews are got total');
        utils.writeToJsonSync('./data/previewsWithHash.json', hashResults);
        resolve(logger.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds'));
      }, err => reject(logger.error(err)));
  });
};
