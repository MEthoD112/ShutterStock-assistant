const resizeImages = require('./src/resize');
const getUnmappedItems = require('./src/getunmapped');
const createReports = require('./src/createreport');
const logger = require('./src/logger');

(() => {
    logger.log(`==================================================================================
                    ShutterStock Assistant is executed!!!
==================================================================================`);

    resizeImages()
        .then(getUnmappedItems)
        .then(createReports)
        .catch(err => logger.error(err));
})();
