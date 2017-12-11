const parseLinks = require('./src/parseLinks');
const downloadPreviews = require('./src/downloadPreviews');
const getPreviewsHashes = require('./src/getPreviewHashes');
const getLocalImages = require('./src/getlocalimages');
const getLocalImagesHashes = require('./src/getlocalimageshashes');
const mappingImagesAndPreviews = require('./src/mapping');
const getUnmappedItems = require('./src/getunmapped');
const createReports = require('./src/createreport');

(() => {
    console.log('ShutterStock Assistant is executed!!!');

    const previews =
        parseLinks()
            .then(downloadPreviews)
            .then(getPreviewsHashes);

    const images =
        getLocalImages()
            .then(getLocalImagesHashes);

    Promise.all([previews, images])
        .then(mappingImagesAndPreviews)
        .then(getUnmappedItems)
        .then(createReports)
        .catch(err => console.error(err));
})();
