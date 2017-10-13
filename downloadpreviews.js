const fs = require('fs');
const request = require('request');
const needle = require('needle');
const tress = require('tress');

function downloadPreview(url, fileName, callback) {
  request.head('https:' + url, function (err, res, body) {
    // fs.readFile('./previews/' + fileName + '.jpg','utf8', function (err, data) {
    //     if (data) {
    //         console.log(data);
    //     }
    // });
    request('https:' + url).pipe(fs.createWriteStream('./previews/' + fileName + '.jpg')).on('close', callback);
  });
};

module.exports.downloadPreviews = function () {
  fs.readFile('./data/previews.json', 'utf8', function (err, data) {
    const previews = JSON.parse(data);
    const previewsDownloadingQueueThreadsNumber = 8;
    const now = Date.now();

    const previewsDownloadingQueue = tress(function (image, callback) {
      downloadPreview(image.imageUrl, image.id, function () {
        console.log('Downloading ' + image.id);
        callback();
      });
    }, previewsDownloadingQueueThreadsNumber);

    previewsDownloadingQueue.drain = function () {
      console.log('Downloading is completed!!!');
      console.log('Executed time: ' + (Date.now() - now));
    }

    previews.forEach(preview => previewsDownloadingQueue.push(preview));
  })
  return 'Downloading previews is executed!!!';
};
require('make-runnable');