const Jimp = require('jimp');
const logger = require('./logger');
const utils = require('./utils');

function resizeImage(image, callback) {
    Jimp.read(image.path)
        .then(Image => {
            Image.resize(250, 150).write('smallimages/' + image.path);
            callback();
        }).catch(err => callback(null, logger.log(err)));
};

function resizeImages(imagesJson) {
    const images = utils.parseArrayData(imagesJson);
    return utils.handleInQueue(images, resizeImage, 8);
};

module.exports = () => {
    const now = Date.now();
    logger.log(`----------------------------------------------------------------------------------
                Resizing images is executed
----------------------------------------------------------------------------------`);
    return new Promise((resolve, reject) => {
        utils.readFile('./data/imagesWithHash.json')
            .then(resizeImages)
            .then(() => {
                logger.log(`++++ Resizing images time: ${(Date.now() - now) / 1000} seconds!!!`);
                resolve(logger.log(`----------------------------------------------------------------------------------
                Resizing images is complited
----------------------------------------------------------------------------------`));
            }, err => reject(logger.error(err)));
    });
}