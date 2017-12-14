const _ = require('lodash');
const logger = require('./logger');
const utils = require('./utils');

function getUnComparePreviews(previews, mappedResults) {
    _.each(mappedResults, result => _.remove(previews, preview => preview.id === result.preview.id));
    return previews;
}

function getUnCompareImages(images, mappedResults) {
    _.each(mappedResults, result => _.remove(images, image => image.path === result.image.path));
    return images;
}

module.exports = () => {
    logger.log('Getting unmapped images and previews is executed');
    return new Promise((resolve, reject) => {
        const promiseArray = [
            utils.readFile('./data/map.json'),
            utils.readFile('./data/previewsWithHash.json'),
            utils.readFile('./data/imagesWithHash.json')
        ];
        Promise.all(promiseArray)
            .then(data => {
                const mappedResults = utils.parseArrayData(data[0]);
                const previews = utils.parseArrayData(data[1]);
                const images = utils.parseArrayData(data[2]);
    
                const unMappedPreviews = getUnComparePreviews(previews, mappedResults);
                const unMappedImages = getUnCompareImages(images, mappedResults);
    
                utils.writeToFileSync('./data/unmappedpreviews.json', unMappedPreviews);
                utils.writeToFileSync('./data/unmappedimages.json', unMappedImages);
                resolve(logger.log('Getting unmapped images and previews is complited'));
            }, err => reject(logger.error(err)));
    });
}