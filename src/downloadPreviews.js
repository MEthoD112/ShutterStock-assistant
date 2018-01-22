const request = require('request');
const progress = require('request-progress');
const logger = require('./logger');
const utils = require('./utils');
const constants = require('./constants');

let errorResults = [], downloadResults = [];

const handleError = (fileName, status) => {
  errorResults.push({ id: fileName, status });
}

const handleDownload = (fileName) => {
  downloadResults.push({ id: fileName });
}

function downloadPreview(image, callback) {
  const fileName = image.id;
  progress(request(image.imageUrl))
    .on('response', response => {
      if (response.statusCode !== constants.statusError) {
        logger.log(`Error Dowloading ${fileName}.jpg!!!`);
        handleError(fileName, response.statusCode);
      } else {
        logger.log(`${fileName}.jpg is downloading!!!`);
        handleDownload(fileName);
      }
    })
    .on('end', callback)
    .on('error', error => {
      logger.error(`Error: ${fileName}. ${error}`);
    })
    .pipe(utils.createWriteStream(`./previews/${fileName}.jpg`));
};

function downloadPreviews(previewsLinks) {
  const previews = utils.parseArrayData(previewsLinks);
  return utils.handleInQueue(previews, downloadPreview, constants.downloadPreviewsThreads);
};

module.exports = () => {
  const now = Date.now();
  logger.log(`----------------------------------------------------------------------------------
                    Downloading previews is executed!!!
----------------------------------------------------------------------------------`);
  return new Promise((resolve, reject) => {
    utils.readFile('./data/previewsLinksDiff.json')
      .then(downloadPreviews)
      .then(() => utils.readFile('./data/downloadPreviewsErr.json'))
      .then(downloadErrJson => {
        const previousErrors = utils.parseArrayData(downloadErrJson);
        logger.log(`++++ ${previousErrors.length} downloading previews errors have already got!!!`);
        logger.log(`++++ ${errorResults.length} downloading previews errors are getting now!!!`);
        previousErrors.push(...errorResults);
        logger.log(`++++ ${previousErrors.length} downloading previews errors are getting total!!!`);
        utils.writeToFileSync('./data/downloadPreviewsErr.json', previousErrors);
        return utils.readFile('./data/downloadPreviews.json')
      })
      .then(downloadedPreviewsJson => {
        const previousDownloadedPreviews = utils.parseArrayData(downloadedPreviewsJson);
        logger.log(`++++ ${previousDownloadedPreviews.length} downloading previews have already got!!!`);
        logger.log(`++++ ${downloadResults.length} previews are downloaded now!!!`);
        previousDownloadedPreviews.push(...downloadResults);
        logger.log(`++++ ${previousDownloadedPreviews.length} previews are downloaded total!!!`);
        utils.writeToFileSync('./data/downloadPreviews.json', previousDownloadedPreviews);
        logger.log(`++++ Downloading time: ${(Date.now() - now) / 1000} seconds!!!`);
        resolve(logger.log(`----------------------------------------------------------------------------------
                    Downloading previews is completed!!!
----------------------------------------------------------------------------------`));
      }, err => reject(logger.error(err)));
  });
};
