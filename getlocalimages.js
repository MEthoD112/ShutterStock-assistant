const fs = require('fs');
const imghash = require('imghash');
const tress = require('tress');
const _ = require('lodash');
const now = Date.now();

function saveImages(images) {
    fs.readFile('./data/imagesWithHash.json', 'utf8', (err, data) => {
        const imagesWithHash = data ? JSON.parse(data) : [];
        imagesWithHash.forEach(imageWithHash => _.remove(images, (image) => image === imageWithHash.id));
        const length = images.length;
        !length ? console.log('All local images are got!!!') : console.log(`${length} new local images age got`);
        fs.writeFileSync('./data/imagesDiff.json', JSON.stringify(images, null, 4));
        console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds');
    });
}

function getLocalImagesPathes(dir, imagesList) {
    let images = fs.readdirSync(dir);
    imagesList = imagesList || [];
    images.forEach((image) => {
        if (fs.statSync(dir + '/' + image).isDirectory()) {
            imagesList = getLocalImagesPathes(dir + '/' + image, imagesList);
        }
        else {
            imagesList.push(dir + '/' + image);
        }
    });
    return imagesList;
};

module.exports.getLocalImages = function () {
    const imagesPathes = getLocalImagesPathes('./images');
    saveImages(imagesPathes);
    return 'Getting local images is executed!!!';
};
require('make-runnable');
