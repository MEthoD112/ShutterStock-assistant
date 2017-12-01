const fs = require('fs');
const request = require('request');
const needle = require('needle');
const tress = require('tress');
const progress = require('request-progress');
const now = Date.now();

function fullfillPreviewsDownloadingQueue(previews, previewsDownloadingQueue) {
  if (!previews.length) console.log('All previews are got!!!');
  previews.forEach(preview => previewsDownloadingQueue.push(preview));
}

function downloadPreview(url, fileName, errorResults, downloadResults, callback) {
  progress(request('https:' + url))
  .on('response', (response) => { 
                    if(response.statusCode !== 200) {
                      console.log(`Error Dowloading ${fileName}.jpg`);
                      errorResults.push({ id: fileName, status: response.statusCode});
                    } 
  })
  .on('error', () => { console.log('Error: ' + fileName) })
  .on('end', () => { console.log(`${fileName}.jpg is downloaded!!!`); downloadResults.push({id: fileName}); callback(); })
  .pipe(fs.createWriteStream('./previews/' + fileName + '.jpg'))
};

function downloadPreviews(previews) {
  const previewsDownloadingQueueThreadsNumber = 10;
  let errorResults = [], downloadResults = [];

  const previewsDownloadingQueue = tress((image, callback) => {
    downloadPreview(image.imageUrl, image.id, errorResults, downloadResults, callback);
  }, previewsDownloadingQueueThreadsNumber);

  previewsDownloadingQueue.drain = function() {
    fs.writeFileSync('./data/downloadPreviewsErr.json', JSON.stringify(errorResults, null, 4));
    console.log(`${downloadResults.length} Previews are downloaded!!!`);
    console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds');
    console.log('Downloading previews is completed!!!');
  };

  fullfillPreviewsDownloadingQueue(previews, previewsDownloadingQueue);
}

module.exports.downloadPreviews = function () {
  fs.readFile('./data/previewsLinksDiff.json', 'utf8', (err, previewsLinks) => {
    const previews = previewsLinks ? JSON.parse(previewsLinks) : [];
    downloadPreviews(previews);    
  })
  return 'Downloading previews is executed!!!';
};
require('make-runnable');
