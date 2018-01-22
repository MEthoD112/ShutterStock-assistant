const Jimp = require('jimp');
const _ = require('lodash');
const hamming = require('hamming-distance');
const logger = require('./logger');
const utils = require('./utils');
const constants = require('./constants');

const compareResults = [];
let resultsForImage = [];
let imageQueue, previewQueue;

function removeMappedResults(images, previews, mappedResults) {
  _.each(mappedResults, result => {
    _.remove(images, image => image.path === result.image.path);
    _.remove(previews, preview => preview.id === result.preview.id);
  });
}

function getPreviews(preview, previewCallback, Image, image) {
  const dist = hamming(image.hash, preview.hash);
  if (dist < constants.maxHammingDist) {
    Jimp.read('previews/' + preview.id + '.jpg')
      .then(Preview => {
        const diff = Jimp.diff(Image, Preview);
        if (diff.percent < constants.maxPixelMatchDiff) {
          const mult = dist * diff.percent;
          resultsForImage.push({ image, preview, hammingDist: dist, pixelMatchDiff: diff.percent, mult });
        }
        previewCallback();
      })
  } else {
    previewCallback();
  }
}

function getImage(previewsAndImage, callback) {
  Jimp.read(previewsAndImage.image.path)
    .then(Image => {
      resultsForImage = [];
      previewQueue = new utils.Queue(previewsAndImage.previews, (preview, previewCallback) => {
        getPreviews(preview, previewCallback, Image, previewsAndImage.image);
      }, constants.mapPreviewsThreads);
      return previewQueue.fullfillQueue().then(() => {
        const group = _.groupBy(resultsForImage, 'image.path');
        _.forIn(group, value => {
          value = _.sortBy(value, ['mult']);
          compareResults.push(value[0]);
          _.each(imageQueue.queue.waiting, item =>
            _.remove(item.data.previews, previewItem => previewItem.id === value[0].preview.id)
          );
        });
        callback();
      });
    }).catch(err => callback(null, logger.log(err)));
}

function mapImagesAndPreviews(previewsAndImage) {
  imageQueue = new utils.Queue(previewsAndImage, getImage, constants.mapImagesThreads);
  return imageQueue.fullfillQueue();
}

module.exports = () => {
  const now = Date.now();
  logger.log(`----------------------------------------------------------------------------------
                    Mapping images and previews is executed!!!
----------------------------------------------------------------------------------`);
  return new Promise((resolve, reject) => {
    Promise.all([utils.readFile('./data/previewsWithHash.json'),
    utils.readFile('./data/imagesWithHash.json'),
    utils.readFile('./data/map.json')])
      .then(data => {
        const previews = utils.parseArrayData(data[0]);
        const images = utils.parseArrayData(data[1]);
        const mapped = utils.parseArrayData(data[2]);
        removeMappedResults(images, previews, mapped);
        if (!images.length) resolve(logger.log('All images are mapped'));
        if (!previews.length) resolve(logger.log('All previews are mapped'));
        const previewsAndImage = [];
        _.each(images, image => {
          previewsAndImage.push({ image, previews });
        })
        return mapImagesAndPreviews(previewsAndImage);
      })
      .then(() => utils.readFile('./data/map.json'))
      .then(mappedJson => {
        const mapped = utils.parseArrayData(mappedJson);
        logger.log(`++++ ${mapped.length} mapped items have been already got!!!`);
        mapped.push(...compareResults);
        logger.log(`++++ ${compareResults.length} mapped items were got now!!!`);
        logger.log(`++++ ${mapped.length} mapped items were got total!!!`);
        utils.writeToFileSync('./data/map.json', mapped);
        resolve(logger.log(`----------------------------------------------------------------------------------
            Mapping images and previews time is ${(Date.now() - now) / 1000} seconds
----------------------------------------------------------------------------------`));
      }, err => reject(logger.error(err)));
  });
};
