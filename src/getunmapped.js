const fs = require('fs-then');
const _ = require('lodash');

function getUnComparePreviews(previews, mappedResults) {
    mappedResults.forEach(result => _.remove(previews, preview => preview.id === result.preview.id));
    return previews;
}

function getUnCompareImages(images, mappedResults) {
    mappedResults.forEach(result => _.remove(images, image => image.path === result.image.path));
    return images;
}

function getUnmappedItems(resolve, reject) {
    const promiseArray = [
        fs.readFile('./data/map.json', 'utf8'),
        fs.readFile('./data/previewsWithHash.json', 'utf8'),
        fs.readFile('./data/imagesWithHash.json', 'utf8')
    ];
    Promise.all(promiseArray)
        .then(data => {
            const mappedResults = data[0] ? JSON.parse(data[0]) : [];
            const previews = data[1] ? JSON.parse(data[1]) : [];
            const images = data[2] ? JSON.parse(data[2]) : [];

            const unMappedPreviews = getUnComparePreviews(previews, mappedResults);
            const unMappedImages = getUnCompareImages(images, mappedResults);

            fs.writeFileSync('./data/unmappedpreviews.json', JSON.stringify(unMappedPreviews, null, 4));
            fs.writeFileSync('./data/unmappedimages.json', JSON.stringify(unMappedImages, null, 4));
            resolve();
        }, err => reject(console.error(err)));
}

module.exports = function () {
    console.log('Getting unmapped images and previews is executed');
    return new Promise((resolve, reject) => {
        getUnmappedItems(resolve, reject);
    });
}