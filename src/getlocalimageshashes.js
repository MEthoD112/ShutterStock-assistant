const imghash = require('imghash');
const tress = require('tress');
const logger = require('./logger');
const utils = require('./utils');
const constants = require('./constants');

let localImagesResults = [], errorResults = [];

function handleHashed(image, hash) {
  localImagesResults.push({ path: image, hash: hash })
  logger.log('Images hashes got: ' + localImagesResults.length);
}

function handleError(image, err) {
  logger.log('Image hash error ' + err + 'Image: ' + image)
  errorResults.push({ path: image.id, err: err });
}

function getImageHash(image, callback) {
  Promise.resolve(imghash.hash(image))
    .then(hash => {
      callback(null, handleHashed(image, hash))
    })
    .catch(err => callback(null, handleError(image, err)));
}

function getImagesHashes(imagesJSON) {
  const images = utils.parseArrayData(imagesJSON);
  return utils.handleInQueue(images, getImageHash, constants.getImagesHashesThreads);
}

module.exports = () => {
  const now = Date.now();
  logger.log(`----------------------------------------------------------------------------------
                      Getting images hashes is executed!!!
----------------------------------------------------------------------------------`);
  return new Promise((resolve, reject) => {
    utils.readFile('./data/imagesDiff.json')
      .then(getImagesHashes)
      .then(() => utils.readFile('./data/imagesWithHash.json'))
      .then(imagesWithHashJson => {
        const imagesWithHash = utils.parseArrayData(imagesWithHashJson);
        logger.log(`++++ Hashes of ${imagesWithHash.length} images have been already got`);
        logger.log(`++++ Hashes of ${localImagesResults.length} images are getting now`);
        imagesWithHash.push(...localImagesResults);
        logger.log(`++++ Hashes of ${imagesWithHash.length} images are got total`);
        utils.writeToFileSync('./data/imagesWithHash.json', imagesWithHash);
        return utils.readFile('./data/imagesWithHashErr.json');
      })
      .then(imageHashErrJSon => {
        const imageHashErrs = utils.parseArrayData(imageHashErrJSon);
        logger.log(`++++ Hash errors of ${imageHashErrs.length} images have been already got`);
        logger.log(`++++ Hash errors of ${errorResults.length} images are getting now`);
        imageHashErrs.push(...errorResults);
        logger.log(`++++ Hash errors of ${imageHashErrs.length} images are got total`);
        utils.writeToFileSync('./data/imagesWithHashErr.json', imageHashErrs);
        resolve(logger.log(`----------------------------------------------------------------------------------
                  Getting images hashes time: ${(Date.now() - now) / 1000} seconds
----------------------------------------------------------------------------------`));
      }, err => reject(logger.error(err)));
  });
};
