const fs = require('fs-then');
const imghash = require('imghash');
const _ = require('lodash');
const now = Date.now();

function saveImagesPathes(images, resolve, reject) {
    fs.readFile('./data/imagesWithHash.json', 'utf8')
        .then(data => {
            const imagesWithHash = data ? JSON.parse(data) : [];
            imagesWithHash.forEach(imageWithHash => _.remove(images, (image) => image === imageWithHash.path));
            const length = images.length;
            !length ? console.log('All local images are got!!!') : console.log(`${length} new local images age got`);
            fs.writeFileSync('./data/imagesDiff.json', JSON.stringify(images, null, 4));
            resolve(console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds'));
        }, err => reject(console.error(err)));
}

function getLocalImagesPathes(dir, imagesList) {
    let images = fs.readdirSync(dir);
    imagesList = imagesList || [];
    images.forEach((image) => {
        const imageType = image.slice(image.lastIndexOf('.') + 1);
        if (fs.statSync(dir + '/' + image).isDirectory()) {
            imagesList = getLocalImagesPathes(dir + '/' + image, imagesList);
        }
        else if (imageType === 'jpg' || imageType === 'jpeg') {
            imagesList.push(dir + '/' + image);
        }
    });
    return imagesList;
};

module.exports = function () {
    console.log('Getting local images is executed!!!');
    return new Promise((resolve, reject) => {
        const imagesPathes = getLocalImagesPathes('./images');
        saveImagesPathes(imagesPathes, resolve, reject);
    });
};
