const fs = require('fs');
const tress = require('tress');
const hamming = require('hamming-distance');
const excel = require('excel4node');
const createHTML = require('create-html');
const Jimp = require('jimp');
const _ = require('lodash');

const now = Date.now();
// const workBook = new excel.Workbook();

// const successMapingSheet = workBook.addWorksheet('Success mapping');
// const unSuccessMapingPreviewsSheet = workBook.addWorksheet('Unsuccess mapping previews');
// const unSuccessMapingImagesSheet = workBook.addWorksheet('Unsuccess mapping images');
// const downloadingErrorsSheet = workBook.addWorksheet('Download Errors');

// const headerStyle = workBook.createStyle({
//   font: {
//     color: 'red',
//     size: 16
//   },
//   alignment: {
//     horizontal: 'center'
//   }
// });

// successMapingSheet.column(1).setWidth(25);
// successMapingSheet.column(2).setWidth(25);
// successMapingSheet.column(3).setWidth(50);
// successMapingSheet.cell(1, 1).string('LOCAL FILE NAME').style(headerStyle);
// successMapingSheet.cell(1, 2).string('PREVIEW FILE NAME').style(headerStyle);
// successMapingSheet.cell(1, 3).string('PREVIEW URL').style(headerStyle);

// unSuccessMapingPreviewsSheet.column(1).setWidth(20);
// unSuccessMapingPreviewsSheet.column(2).setWidth(120);
// unSuccessMapingPreviewsSheet.cell(1, 1).string('PREVIEW ID').style(headerStyle);
// unSuccessMapingPreviewsSheet.cell(1, 2).string('PREVIEW LINK').style(headerStyle);

// unSuccessMapingImagesSheet.column(1).setWidth(20);
// unSuccessMapingImagesSheet.cell(1, 1).string('PATH').style(headerStyle);

// downloadingErrorsSheet.column(1).setWidth(20);
// downloadingErrorsSheet.column(2).setWidth(20);
// downloadingErrorsSheet.cell(1, 1).string('PREVIEW ID').style(headerStyle);
// downloadingErrorsSheet.cell(1, 2).string('STATUS CODE').style(headerStyle);

function fillTableRowsForSuccessMapping(items) {
  items.forEach((item, i) => {
    successMapingSheet.cell(i + 2, 1).string(item.localImage);
    successMapingSheet.cell(i + 2, 2).string(item.preview + '.jpg');
    successMapingSheet.cell(i + 2, 3).link('https:' + item.previewUrl);
  });
}

function fillTableRowForUnsuccessPreviewsMapping(items) {
  items.forEach((item, i) => {
    unSuccessMapingPreviewsSheet.cell(i + 2, 1).string(item.id + '.jpg');
    unSuccessMapingPreviewsSheet.cell(i + 2, 2).link('https:' + item.imageUrl);
  });
}

function fillTableRowForUnsuccessImagesMapping(items) {
  items.forEach((item, i) => {
    unSuccessMapingImagesSheet.cell(i + 2, 1).string(item.id);
  });
}

function fillTableRowsForDownloadingErrors() {
  fs.readFile('./data/downloadPreviewsErr.json', 'utf8', (err, data) => {
    const errors = data ? JSON.parse(data) : [];
    errors.forEach((error, i) => {
      downloadingErrorsSheet.cell(i + 2, 1).string(error.id);
      downloadingErrorsSheet.cell(i + 2, 2).number(error.status);
    });
  });
}

function getUnComparePreviews(previews, compareResults) {
  compareResults.forEach(result => _.remove(previews, (preview) => preview.id === result.preview));
  return previews;
}

function getUnCompareImages(images, compareResults) {
  compareResults.forEach(result => _.remove(images, (image) => image.id === result.localImage));
  return images;
}

function fillHtmlTableWithSuccessMaping(results) {
  let html = '';
  results.forEach(result => {
    html += `<tr><td>${result.localImage}</td><td><img class='image' src=../${result.localImage}></td><td>${result.preview}</td><td><a href=https:${result.previewUrl}>Link</a></td>
    <td><img class='image' src=../previews/${result.preview}.jpg></td></tr>`
  });
  return `<table class="table"><tr><th>LOCAL FILE NAME</th><th>LOCAL PREVIEW</th><th>PREVIEW FILE NAME</th><th>PREVIEW URL</th><th>PREVIEW</th></tr>${html}</table>`;
}

function fillHtmlTableWithUnsuccessMappedPreviews(results) {
  let html = '';
  results.forEach(result => {
    html += `<tr><td>${result.id}</td><td><a href=https:${result.imageUrl}>Link</a></td>
    <td><img class='image' src=../previews/${result.id}.jpg></td></tr>`
  });
  return `<table class="table"><tr><th>PREVIEW FILE NAME</th><th>PREVIEW URL</th><th>PREVIEW</th></tr>${html}</table>`;
}

function fillHtmlTableWithUnsuccessMappedImages(results) {
  let html = '';
  results.forEach(result => {
    html += `<tr><td>${result.id}</td><td><img src=../${result.id}></td></tr>`
  });
  return `<table class="table"><tr><th>PATH TO LOCAL IMAGE</th><th>LOCAL IMAGE PREVIEW</th></tr>${html}</table>`;
}

function fullfillComparingImagesQueue(comparingImagesQueue) {
  fs.readFile('./data/previewsWithHash.json', 'utf8', (err, data) => {
    const previews = data ? JSON.parse(data) : [];
    fs.readFile('./data/imagesWithHash.json', 'utf8', (err, data) => {
      const images = data ? JSON.parse(data) : [];
      images.forEach(image => {
        previews.forEach(preview => {
          const previewAndImage = { image: image.id, preview: `${preview.id}.jpg` };
          comparingImagesQueue.push(previewAndImage);
        });
      });
    });
  });
}

function compareHashes(previewAndImage, callback, compareResults, comparingImagesQueue) {
  const array = [Jimp.read('previews/' + previewAndImage.preview), Jimp.read(previewAndImage.image)];
  Promise.all(array).then(results => {
      const dist = Jimp.distance(results[0], results[1]);
      const diff = Jimp.diff(results[0], results[1], 0.1);
      if (dist < 0.15 || diff.percent < 0.15) {
        console.log(dist);
        console.log(diff.percent);
        console.log(previewAndImage.preview);
        console.log(previewAndImage.image);
      }
      callback();
    }).catch(err => { console.log(err); callback();});

  // }).catch((err) => {
  //   console.log(err);
  //   callback();
  //   //callback(null, rejectHash(preview, err, errorResults))
  // });
  // const dist = hamming(image.hash, preview.hash);

  // if (dist <= 20) {

  //   results.push({ localImage: image.id, previewUrl: preview.imageUrl, preview: preview.id, dist: dist });
  // }
}

function createComparingImagesQueue() {
  const compareResults = [];
  const comparingImagesQueueThreadsNumber = 50;
  const comparingImagesQueue = tress((previewAndImage, callback) => {
    compareHashes(previewAndImage, callback, compareResults, comparingImagesQueue);
  }, comparingImagesQueueThreadsNumber);

  comparingImagesQueue.drain = function () {
    console.log('Executed time: ' (Date.now() - now) / 1000 + ' seconds');
  }

  fullfillComparingImagesQueue(comparingImagesQueue);
}

module.exports.createReport = function () {
  createComparingImagesQueue();
  //fillTableRowsForDownloadingErrors();

  //const compareResults = compareHashes(images, previews);
  //console.log(compareResults);
  //const unComparePreviews = getUnComparePreviews(previews, compareResults);
  //const unCompareImages = getUnCompareImages(images, compareResults);

  //fillTableRowsForSuccessMapping(compareResults);
  //fillTableRowForUnsuccessPreviewsMapping(unComparePreviews);
  //fillTableRowForUnsuccessImagesMapping(unCompareImages);

  // const htmlFile = createHTML({
  //   title: 'ShutterStock Report',
  //   head: '<base target="_blank">',
  //   css: ['../css/bootstrap.min.css', '../css/style.css'],
  //   script: ['../scripts/jquery.js', '../scripts/bootstrap.js',],
  //   lang: 'en',
  //   body:
  //     `<ul class="nav nav-tabs" id="myTab" role="tablist">
  //     <li class="nav-item">
  //       <a class="nav-link active" id="success-tab" data-toggle="tab" href="#success" role="tab" aria-controls="success" aria-selected="true">Success Mapping</a>
  //     </li>
  //     <li class="nav-item">
  //       <a class="nav-link" id="previews-tab" data-toggle="tab" href="#previews" role="tab" aria-controls="previews" aria-selected="false">UnSuccess Mapped Previews</a>
  //     </li>
  //     <li class="nav-item">
  //       <a class="nav-link" id="images-tab" data-toggle="tab" href="#images" role="tab" aria-controls="images" aria-selected="false">UnSuccess Mapped Images</a>
  //     </li>
  //     <li class="nav-item">
  //     <a class="nav-link" id="errors-tab" data-toggle="tab" href="#errors" role="tab" aria-controls="errors" aria-selected="false">Downloading Previews Errors</a>
  //     </li>
  //   </ul>
  //   <div class="tab-content" id="myTabContent">
  //     <div class="tab-pane fade show active" id="success" role="tabpanel" aria-labelledby="success-tab">${fillHtmlTableWithSuccessMaping(compareResults)}</div>
  //     <div class="tab-pane fade" id="previews" role="tabpanel" aria-labelledby="previews-tab">${fillHtmlTableWithUnsuccessMappedPreviews(unComparePreviews)}</div>
  //     <div class="tab-pane fade" id="images" role="tabpanel" aria-labelledby="images-tab">${fillHtmlTableWithUnsuccessMappedImages(unCompareImages)}</div>
  //     <div class="tab-pane fade" id="errors" role="tabpanel" aria-labelledby="errors-tab">Downloading Errors</div>
  //   </div>`
  // });

  // fs.writeFile('./data/report.html', htmlFile, (err) => {
  //   if (err) console.log(err);
  // });

  // workBook.write('./data/compare.xlsx', (err) => {
  //   err ? console.error(err) : console.log('Report is created in ./data/compare.xlsx. Executed time: ' + (Date.now() - now) / 1000 + ' seconds');
  // });
  return 'Comparing images and previews hashes is executed!!!';
};
require('make-runnable');
