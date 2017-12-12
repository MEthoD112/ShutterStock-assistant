const imghash = require('imghash');
const _ = require('lodash');
const logger = require('./logger');
const utils = require('./utils');

function saveImagesPathes(images, resolve, reject, now) {
    utils.readFile('./data/imagesWithHash.json')
        .then(data => {
            const imagesWithHash = utils.parseArrayData(data);
            imagesWithHash.forEach(imageWithHash => _.remove(images, (image) => image === imageWithHash.path));
            const length = images.length;
            !length ? logger.log('All local images are got!!!') : logger.log(`${length} new local images age got`);
            utils.writeToJsonSync('./data/imagesDiff.json', images);
            resolve(logger.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds'));
        }, err => reject(logger.error(err)));
}

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
        const imagesPathes = getLocalImagesPathes('./images');
        saveImagesPathes(imagesPathes, resolve, reject, now);
    });
};
