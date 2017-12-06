const fs = require('fs-then');
const request = require('request');
const tress = require('tress');
const progress = require('request-progress');
const now = Date.now();

function fullfillPreviewsDownloadingQueue(previews, previewsDownloadingQueue, resolve) {
  if (!previews.length) resolve(console.log('All previews are downloaded!!!'));
  previews.forEach(preview => previewsDownloadingQueue.push(preview));
}

function downloadPreview(url, fileName, errorResults, downloadResults, callback) {
  progress(request(url))
    .on('response', (response) => {
      if (response.statusCode !== 200) {
        console.log(`Error Dowloading ${fileName}.jpg`);
        errorResults.push({ id: fileName, status: response.statusCode });
      }
    })
    .on('error', () => { console.log('Error: ' + fileName) })
    .on('end', () => { console.log(`${fileName}.jpg is downloaded!!!`); downloadResults.push({ id: fileName }); callback(); })
    .pipe(fs.createWriteStream('./previews/' + fileName + '.jpg'))
};

function downloadPreviews(previews, resolve) {
  let errorResults = [], downloadResults = [];

  const previewsDownloadingQueue = tress((image, callback) => {
    downloadPreview(image.imageUrl, image.id, errorResults, downloadResults, callback);
  }, 10);

  previewsDownloadingQueue.drain = function () {
    fs.readFile('./data/downloadPreviewsErr.json', 'utf8')
      .then(downloadErr => {
        const previousErrors = downloadErr ? JSON.parse(downloadErr) : [];
        previousErrors.push(...errorResults);
        fs.writeFileSync('./data/downloadPreviewsErr.json', JSON.stringify(previousErrors, null, 4));
        console.log(`${downloadResults.length} Previews are downloaded!!!`);
        console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds');
        resolve(console.log('Downloading previews is completed!!!'));
      }, err => console.error(err));
  };

  fullfillPreviewsDownloadingQueue(previews, previewsDownloadingQueue, resolve);
}

module.exports = function () {
  console.log('Downloading previews is executed!!!');
  return new Promise((resolve, reject) => {
    fs.readFile('./data/previewsLinksDiff.json', 'utf8')
      .then(previewsLinks => {
        const previews = previewsLinks ? JSON.parse(previewsLinks) : [];
        downloadPreviews(previews, resolve);
      }, err => reject(console.error(err)));
  });
};
