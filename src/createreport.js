const fs = require('fs-then');
const excel = require('excel4node');
const createHTML = require('create-html');
const now = Date.now();
const workBook = new excel.Workbook();

const successMapingSheet = workBook.addWorksheet('Success mapping');
const unSuccessMapingPreviewsSheet = workBook.addWorksheet('Unsuccess mapping previews');
const unSuccessMapingImagesSheet = workBook.addWorksheet('Unsuccess mapping images');
const downloadingErrorsSheet = workBook.addWorksheet('Download Errors');

const headerStyle = workBook.createStyle({
  font: {
    color: 'red',
    size: 16
  },
  alignment: {
    horizontal: 'center'
  }
});

successMapingSheet.column(1).setWidth(25);
successMapingSheet.column(2).setWidth(25);
successMapingSheet.column(3).setWidth(50);
successMapingSheet.cell(1, 1).string('LOCAL FILE NAME').style(headerStyle);
successMapingSheet.cell(1, 2).string('PREVIEW FILE NAME').style(headerStyle);
successMapingSheet.cell(1, 3).string('PREVIEW URL').style(headerStyle);

unSuccessMapingPreviewsSheet.column(1).setWidth(20);
unSuccessMapingPreviewsSheet.column(2).setWidth(120);
unSuccessMapingPreviewsSheet.cell(1, 1).string('PREVIEW ID').style(headerStyle);
unSuccessMapingPreviewsSheet.cell(1, 2).string('PREVIEW LINK').style(headerStyle);

unSuccessMapingImagesSheet.column(1).setWidth(20);
unSuccessMapingImagesSheet.cell(1, 1).string('PATH').style(headerStyle);

downloadingErrorsSheet.column(1).setWidth(20);
downloadingErrorsSheet.column(2).setWidth(20);
downloadingErrorsSheet.cell(1, 1).string('PREVIEW ID').style(headerStyle);
downloadingErrorsSheet.cell(1, 2).string('STATUS CODE').style(headerStyle);

function fillTableRowsForSuccessMapping(items) {
  items.forEach((item, i) => {
    successMapingSheet.cell(i + 2, 1).string(item.image.path);
    successMapingSheet.cell(i + 2, 2).string(item.preview.id + '.jpg');
    successMapingSheet.cell(i + 2, 3).link('https:' + item.preview.imageUrl);
  });
}

function fillTableRowForUnsuccessPreviewsMapping(previews) {
  previews.forEach((preview, i) => {
    unSuccessMapingPreviewsSheet.cell(i + 2, 1).string(preview.id + '.jpg');
    unSuccessMapingPreviewsSheet.cell(i + 2, 2).link(preview.imageUrl);
  });
}

function fillTableRowForUnsuccessImagesMapping(images) {
  images.forEach((image, i) => {
    unSuccessMapingImagesSheet.cell(i + 2, 1).string(image.path);
  });
}

function fillTableRowsForDownloadingErrors(errors) {
  errors.forEach((error, i) => {
    downloadingErrorsSheet.cell(i + 2, 1).string(error.id);
    downloadingErrorsSheet.cell(i + 2, 2).number(error.status);
  });
}

function fillHtmlTableWithSuccessMaping(results) {
  let html = '';
  results.forEach(result => {
    html += `<tr><td>${result.image.path}</td><td><img class='image' src=../${result.image.path}></td><td>${result.preview.id}</td><td><a href=${result.preview.imageUrl}>Link</a></td>
      <td><img class='image' src=../previews/${result.preview.id}.jpg></td></tr>`
  });
  return `<table class="table"><tr><th>LOCAL FILE NAME</th><th>LOCAL PREVIEW</th><th>PREVIEW FILE NAME</th><th>PREVIEW URL</th><th>PREVIEW</th></tr>${html}</table>`;
}

function fillHtmlTableWithUnsuccessMappedPreviews(results) {
  let html = '';
  results.forEach(result => {
    html += `<tr><td>${result.id}</td><td><a href=${result.imageUrl}>Link</a></td>
      <td><img class='image' src=../previews/${result.id}.jpg></td></tr>`
  });
  return `<table class="table"><tr><th>PREVIEW FILE NAME</th><th>PREVIEW URL</th><th>PREVIEW</th></tr>${html}</table>`;
}

function fillHtmlTableWithUnsuccessMappedImages(results) {
  let html = '';
  results.forEach(result => {
    html += `<tr><td>${result.path}</td><td><img src=../${result.path}></td></tr>`
  });
  return `<table class="table"><tr><th>PATH TO LOCAL IMAGE</th><th>LOCAL IMAGE PREVIEW</th></tr>${html}</table>`;
}

function fillHtmlTableWithDownloadingPreviewsErrs(results) {
  let html = '';
  results.forEach(result => {
    html += `<tr><td>${result.id}</td><td>${result.status}</td></tr>`
  });
  return `<table class="table"><tr><th>PREVIEW ID</th><th>STATUS CODE</th></tr>${html}</table>`;
}

function createHtml(mappedResults, unMappedPreviews, unMappedImages, downloadPreviewsErrors) {
  return createHTML({
    title: 'ShutterStock Report',
    head: '<base target="_blank">',
    css: ['../css/bootstrap.min.css', '../css/style.css'],
    script: ['../scripts/jquery.js', '../scripts/bootstrap.js',],
    lang: 'en',
    body:
      `<ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item">
          <a class="nav-link active" id="success-tab" data-toggle="tab" href="#success" role="tab" aria-controls="success" aria-selected="true">Success Mapping</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" id="previews-tab" data-toggle="tab" href="#previews" role="tab" aria-controls="previews" aria-selected="false">UnSuccess Mapped Previews</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" id="images-tab" data-toggle="tab" href="#images" role="tab" aria-controls="images" aria-selected="false">UnSuccess Mapped Images</a>
        </li>
        <li class="nav-item">
        <a class="nav-link" id="errors-tab" data-toggle="tab" href="#errors" role="tab" aria-controls="errors" aria-selected="false">Downloading Previews Errors</a>
        </li>
      </ul>
      <div class="tab-content" id="myTabContent">
        <div class="tab-pane fade show active" id="success" role="tabpanel" aria-labelledby="success-tab">${fillHtmlTableWithSuccessMaping(mappedResults)}</div>
        <div class="tab-pane fade" id="previews" role="tabpanel" aria-labelledby="previews-tab">${fillHtmlTableWithUnsuccessMappedPreviews(unMappedPreviews)}</div>
        <div class="tab-pane fade" id="images" role="tabpanel" aria-labelledby="images-tab">${fillHtmlTableWithUnsuccessMappedImages(unMappedImages)}</div>
        <div class="tab-pane fade" id="errors" role="tabpanel" aria-labelledby="errors-tab">${fillHtmlTableWithDownloadingPreviewsErrs(downloadPreviewsErrors)}</div>
      </div>`
  });
}

function createReport() {
  const promiseArray = [
    fs.readFile('./data/map.json', 'utf8'),
    fs.readFile('./data/unmappedpreviews.json', 'utf8'),
    fs.readFile('./data/unmappedimages.json', 'utf8'),
    fs.readFile('./data/downloadPreviewsErr.json', 'utf8')
  ];
  Promise.all(promiseArray)
    .then(data => {
      const mappedResults = data[0] ? JSON.parse(data[0]) : [];
      const unMappedPreviews = data[1] ? JSON.parse(data[1]) : [];
      const unMappedImages = data[2] ? JSON.parse(data[2]) : [];
      const downloadPreviewsErrors = data[3] ? JSON.parse(data[3]) : [];

      const htmlFile = createHtml(mappedResults, unMappedPreviews, unMappedImages, downloadPreviewsErrors);

      fillTableRowsForSuccessMapping(mappedResults);
      fillTableRowForUnsuccessPreviewsMapping(unMappedPreviews);
      fillTableRowForUnsuccessImagesMapping(unMappedImages);
      fillTableRowsForDownloadingErrors(downloadPreviewsErrors);

      fs.writeFile('./reports/report.html', htmlFile)
        .then(err => {
          err ? console.error(err) : console.log('HTML report is created in ./reports/report.html');
        });

      workBook.write('./reports/report.xlsx', err => {
        err ? console.error(err) : console.log('Excel report is created in ./reports/report.xlsx.');
      });

    }, err => console.error(err));
}

module.exports = function () {
  console.log('Creating reports is executed!!!');
  createReport();
}