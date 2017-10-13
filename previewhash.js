const fs = require('fs');
const imghash = require('imghash');
const tress = require('tress');

module.exports.getPreviewsHash = function () {
  const results = [];

  fs.readFile('./data/previews.json', 'utf8', function (err, data) {
    const previews = JSON.parse(data);
    const previewsGettingHashesQueueThreadsNumber = 10;
    const now = Date.now();

    const previewsGettingHashesQueue = tress(function (image, callback) {
      console.log('Hashes got: ' + results.length);
      Promise.resolve(imghash.hash('previews/' + image.id + '.jpg'))
             .then(hash => {
                   callback(null, results.push({ id: image.id, hash: hash }))
              })
              .catch(err => callback(null, console.log('Hash error: ' + err + 'FileName: ' + image.id)));
      }, previewsGettingHashesQueueThreadsNumber);

      previewsGettingHashesQueue.drain = function () {
            console.log('Hashes of ' + results.length + ' images are got');
            console.log('Executed time: ' + (Date.now() - now));
            fs.writeFileSync('./data/previewsWithHash.json', JSON.stringify(results, null, 4));
        }

      previews.forEach(preview => previewsGettingHashesQueue.push(preview));
    })
    return 'Getting previews hashes is executed';
};
require('make-runnable');
