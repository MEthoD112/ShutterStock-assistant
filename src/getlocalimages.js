const _ = require('lodash');
const logger = require('./logger');
const utils = require('./utils');
const constants = require('./constants');

function getLocalImagesPathes(dir, imagesList) {
    let images = utils.readDir(dir);
    imagesList = imagesList || [];
    images.forEach(image => {
        const imageType = image.slice(image.lastIndexOf('.') + 1);
        if (utils.statSync(dir + '/' + image).isDirectory()) {
            imagesList = getLocalImagesPathes(dir + '/' + image, imagesList);
        }
        else if (imageType === 'jpg' || imageType === 'jpeg') {
            imagesList.push(dir + '/' + image);
        }
    });
    return imagesList;
};

module.exports = () => {
    const now = Date.now();
    logger.log('Getting local images is executed!!!');
    return new Promise((resolve, reject) => {
        const imagesPathes = getLocalImagesPathes(constants.imagesFolder);
        utils.readFile('./data/imagesWithHash.json')
            .then(data => {
                const imagesWithHash = utils.parseArrayData(data);
                imagesWithHash.forEach(imageWithHash => _.remove(imagesPathes, (image) => image === imageWithHash.path));
                const length = imagesPathes.length;
                !length ? logger.log('All local images are got!!!') : logger.log(`${length} new local images age got`);
                utils.writeToFileSync('./data/imagesDiff.json', imagesPathes);
                resolve(logger.log('Getting local images time: ' + (Date.now() - now) / 1000 + ' seconds'));
            }, err => reject(logger.error(err)));
    });
};
