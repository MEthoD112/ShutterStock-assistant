const fs = require('fs');
const request = require('request');
const needle = require('needle');
const tress = require('tress');
const progress = require('request-progress');

const now = Date.now();
let downloadsCount = 0, errorResults = [];

function drain() {
  fs.writeFileSync('./data/downloadPreviewsErr.json', JSON.stringify(errorResults, null, 4));
  console.log(`${downloadsCount} Previews are downloaded!!!`);
  console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds');
  console.log('Downloading previews is completed!!!');
}

function downloadPreview(url, fileName, callback) {
  progress(request('https:' + url))
  .on('response', (response) => { 
                    if(response.statusCode !== 200) {
                      console.log(`Error Dowloading ${fileName}.jpg`);
                      errorResults.push({ id: fileName, status: response.statusCode}); } 
  })
  .on('error', () => { console.log('Error: ' + fileName) })
  .on('end', () => { console.log(`${fileName}.jpg is downloaded!!!`); downloadsCount++; callback(); })
  .pipe(fs.createWriteStream('./previews/' + fileName + '.jpg'))
};

function createDownloadingQueue(previews) {
  const previewsDownloadingQueueThreadsNumber = 10;
  const previewsDownloadingQueue = tress((image, callback) => {
    downloadPreview(image.imageUrl, image.id, callback);
  }, previewsDownloadingQueueThreadsNumber);

  previewsDownloadingQueue.drain = drain;
  previews.forEach(preview => previewsDownloadingQueue.push(preview));
}

module.exports.downloadPreviews = function () {
  fs.readFile('./data/previewsLinksDiff.json', 'utf8', (err, previewsLinks) => {
    const previews = previewsLinks ? JSON.parse(previewsLinks) : [];
    createDownloadingQueue(previews);    
  })
  return 'Downloading previews is executed!!!';
};
require('make-runnable');
