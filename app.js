const parseLinks = require('./src/parseLinks');
const downloadPreviews = require('./src/downloadPreviews');
const getPreviewsHashes = require('./src/getPreviewHashes');
const getLocalImages = require('./src/getlocalimages');
const getLocalImagesHashes = require('./src/getlocalimageshashes');
const mappingImagesAndPreviews = require('./src/mapping');
const getUnmappedItems = require('./src/getunmapped');
const createReports = require('./src/createreport');
const logger = require('./src/logger');

(() => {
    logger.log(`==================================================================================
                    ShutterStock Assistant is executed!!!
==================================================================================`);

    parseLinks()
        .then(downloadPreviews)
        .then(getPreviewsHashes)
        .then(getLocalImages)
        .then(getLocalImagesHashes)
        .then(mappingImagesAndPreviews)
        .then(getUnmappedItems)
        .then(createReports)
        .catch(err => logger.error(err));
})();
