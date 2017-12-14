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
    console.log('ShutterStock Assistant is executed!!!');

    const previews =
        parseLinks()
            .then(downloadPreviews)
            .then(getPreviewsHashes)
            .then(mapPreviewsDates)

    const images =
        getLocalImages()
            .then(getLocalImagesHashes)

    Promise.all([images, previews])
        .then(mappingImagesAndPreviews)
        .then(getMostRelevantResults)
        .then(getUnmappedItems)
        .then(createReports)
        .catch(err => logger.error(err));
})();
