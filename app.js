const parseLinks = require('./src/parseLinks');
const downloadPreviews = require('./src/downloadPreviews');
const getPreviewsHashes = require('./src/getPreviewHashes');
const mapPreviewsDates = require('./src/mappreviewsdates');
const getLocalImages = require('./src/getlocalimages');
const getLocalImagesHashes = require('./src/getlocalimageshashes');
const mappingImagesAndPreviews = require('./src/mapping');
const getMostRelevantResults = require('./src/getrelevant');
const getUnmappedItems = require('./src/getunmapped');
const createReports = require('./src/createreport');
const logger = require('./src/logger');

(() => {
    logger.log('ShutterStock Assistant is executed!!!');

    parseLinks()
        .then(downloadPreviews)
        .then(getPreviewsHashes)
        .then(mapPreviewsDates)
        .then(getLocalImages)
        .then(getLocalImagesHashes)
        .then(mappingImagesAndPreviews)
        //.then(getMostRelevantResults)
        .then(getUnmappedItems)
        .then(createReports)
        .catch(err => logger.error(err));
})();
