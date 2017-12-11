const request = require('request');
const progress = require('request-progress');
const logger = require('./logger');
const utils = require('./utils');

let errorResults = [], downloadResults = [];

const handleError = (fileName, status) => {
  errorResults.push({ id: fileName, status });
}
const handleDownloaded = fileName => {
  downloadResults.push({ id: fileName });
}

function downloadPreview(image, callback) {
  const fileName = image.id;

  progress(request(image.imageUrl))
    .on('response', response => {
      if (response.statusCode !== 200) {
        logger.log(`Error Dowloading ${fileName}.jpg`);
        handleError(fileName, response.statusCode);
      }
    })
    .on('end', () => {
      logger.log(`${fileName}.jpg is downloaded!!!`);
      handleDownloaded(fileName);
      callback();
    })
    .on('error', error => {
      logger.error(`Error: ${fileName}. ${error}`);
    })
    .pipe(utils.createWriteStream(`./previews/${fileName}.jpg`));
};

function downloadPreviews(previewsLinks) {
  const previews = utils.parseArrayData(previewsLinks);
  return utils.handleInQueue(previews, downloadPreview, 10);
};

module.exports = () => {
  const now = Date.now();
  logger.log(`Downloading previews is executed!!!`);
  return new Promise((resolve, reject) => {
    utils.readFile('./data/previewsLinksDiff.json', 'utf8')
      .then(downloadPreviews)
      .then(() => utils.readFile('./data/downloadPreviewsErr.json'))
      .then(downloadErr => {
        const previousErrors = utils.parseArrayData(downloadErr);
        previousErrors.push(...errorResults);
        utils.writeToFileSync('./data/downloadPreviewsErr.json', previousErrors);
        logger.log(`${downloadResults.length} Previews are downloaded!!!`);
        logger.log(`Downloading time: ${(Date.now() - now) / 1000} seconds`);
        resolve(logger.log(`Downloading previews is completed!!!`));
      })
  });
};
