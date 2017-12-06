const fs = require('fs-then');
const tress = require('tress');
const Jimp = require('jimp');
const _ = require('lodash');
const hamming = require('hamming-distance');
const now = Date.now();

function removeMappedResults(images, previews, mappedResults) {
  mappedResults.forEach(result => {
    _.remove(images, image => image.path === result.image.path);
    _.remove(previews, preview => preview.id === result.preview.id);
  });
}

function fullfillImagesQueue(imagesQueue, resolve) {
  Promise.all([fs.readFile('./data/previewsWithHash.json', 'utf8'),
              fs.readFile('./data/imagesWithHash.json', 'utf8'),
              fs.readFile('./data/map.json', 'utf8')])
    .then((data) => {
      const previews = data[0] ? JSON.parse(data[0]) : [];
      const images = data[1] ? JSON.parse(data[1]) : [];
      const mapped = data[2] ? JSON.parse(data[2]) : [];
      removeMappedResults(images, previews, mapped);
      if (!images.length) resolve(console.log('All images are mapped'));
      images.forEach(image => {
        const previewsAndImage = { image: image, previews: previews };
        imagesQueue.push(previewsAndImage);
      });
    });
}

function fullfillPreviewsQueue(previews, previewsQueue) {
  previews.forEach(preview => {
    previewsQueue.push(preview);
  });
}

function getPreviews(image, result, preview, previewCallback, compareResults, previewsQueue, count) {
  const dist = hamming(image.hash, preview.hash);
  count.push(1);
  console.log((Date.now() - now) / 1000 + ' seconds Images: ' + count.length);
  if (dist < 20) {
  Jimp.read('previews/' + preview.id + '.jpg')
    .then(Preview => {
      const diff = Jimp.diff(result, Preview, 0.1);
      if (diff.percent < 0.5) {
        compareResults.push({ image: image, preview: preview, hammingDist: dist, pixelMatchDiff: diff.percent });
        _.remove(previewsQueue.waiting, queueItem => queueItem.data);
      }
      previewCallback();
    })
  } else {
    previewCallback();
  }  
}

function getImage(previewsAndImage, callback, compareResults, imagesQueue, count) {
  Jimp.read(previewsAndImage.image.path)
    .then(result => {

      const previewsQueue = tress((preview, previewCallback) => {
        getPreviews(previewsAndImage.image, result, preview, previewCallback, compareResults, previewsQueue, count);
      }, 8);

      previewsQueue.drain = callback;

      fullfillPreviewsQueue(previewsAndImage.previews, previewsQueue);

    }).catch(err => callback(null, console.log(err)));

}

function mapImagesAndPreviews(resolve, reject) {
  const compareResults = [];
  const count = [];

  const imagesQueue = tress((previewsAndImage, callback) => {
    getImage(previewsAndImage, callback, compareResults, imagesQueue, count);
  }, 8);

  imagesQueue.drain = function () {
    fs.readFile('./data/map.json', 'utf8')
      .then(mappedResults => {
        const previousMappedResults = mappedResults ? JSON.parse(mappedResults) : [];
        console.log(`${compareResults.length} new results are got`);
        previousMappedResults.push(...compareResults);
        fs.writeFileSync('./data/map.json', JSON.stringify(previousMappedResults, null, 4));
        console.log('Parsing time: ' + (Date.now() - now) / 1000 + ' seconds');
        resolve(console.log('Mapping is complited!!!'));
      }, err => console.error(err));
  }

  imagesQueue.error = reject;

  fullfillImagesQueue(imagesQueue, resolve);
}

module.exports = function () {
  console.log('Mapping images and previews is executed!!!');
  return new Promise((resolve, reject) => {
    mapImagesAndPreviews(resolve, reject);
  });
};
