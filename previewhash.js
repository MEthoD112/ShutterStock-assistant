const fs = require('fs');
const imghash = require('imghash');
const tress = require('tress');

module.exports.getHash = function () {
    const now = Date.now();
    const results = [];

    fs.readFile('./data/previews.json','utf8', function (err, data) {
        const previews = JSON.parse(data);

        const q = tress(function (image, callback) {
            console.log('Hashes got: ' + results.length);
            Promise.resolve(imghash.hash('previews/' + image.id + '.jpg'))
                .then(hash => {
                    callback(null, results.push({ id: image.id, hash: hash }))
                })
                .catch(err => console.log(err));
        }, 50);

        q.drain = function () {
            console.log('Hashes of ' + results.length + ' images are got');
            console.log('Executed time: ' + (Date.now - now));
            fs.writeFileSync('./data/previewsWithHash.json', JSON.stringify(results, null, 4));
        }

        for (let i = 0; i < previews.length; i++) {
            q.push(previews[i]);
        }
    })
    return 'Getting hashes is executed';
};
require('make-runnable');
