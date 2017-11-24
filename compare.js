const fs = require('fs');
const hamming = require('hamming-distance');
const excel = require('excel4node');

const now = Date.now();
const compareResults = [];
const workBook = new excel.Workbook();
const workSheet = workBook.addWorksheet('ShutterStock report');
const headerStyle = workBook.createStyle({
  font: {
    color: 'red',
    size: 16
  },
  alignment: {
    horizontal: 'center'
  }
});

workSheet.column(1).setWidth(25);
workSheet.column(2).setWidth(25);
workSheet.column(3).setWidth(50);
workSheet.column(4).setWidth(15);
workSheet.cell(1, 1).string('LOCAL FILE NAME').style(headerStyle);
workSheet.cell(1, 2).string('PREVIEW FILE NAME').style(headerStyle);
workSheet.cell(1, 3).string('PREVIEW URL').style(headerStyle);
workSheet.cell(1, 4).string('DISTANCE').style(headerStyle);

function fillTableRow(items) {
  for (let i = 0; i < items.length; i++) {
    workSheet.cell(i + 2, 1).string(items[i].localImage);
    workSheet.cell(i + 2, 2).string(items[i].preview + '.jpg');
    workSheet.cell(i + 2, 3).string('https://' + items[i].previewUrl);
    workSheet.cell(i + 2, 4).number(items[i].dist);
  }
}

module.exports.compare = function () {
  fs.readFile('./data/previewsWithHash.json', 'utf8', (err, data) => {
    const previews = data ? JSON.parse(data) : [];
    fs.readFile('./data/imagesWithHash.json', 'utf8', (err, data) => {
      const images = data ? JSON.parse(data) : [];

      images.forEach(image => {
        const results = [];
        previews.forEach(preview => {
          const dist = hamming(image.hash, preview.hash);

          if (dist <= 20) {
            results.push({ localImage: image.id, previewUrl: preview.imageUrl, preview: preview.id, dist: dist });
          }
        });
        results.sort((a, b) => a.dist - b.dist);
        compareResults.concat(results[0]);
      });
      fillTableRow(compareResults);
      console.log('Executed time: ' + (Date.now() - now) / 1000 + ' seconds');
      workBook.write('./data/compare.xlsx', (err) => {
        err ? console.error(err) : console.log('Data is saved in ./data/compare.xlsx');
      });
      fs.writeFileSync('./data/compare.json', JSON.stringify(compareResults, null, 4));
    });
  });
  return 'Comparing images and previews hashes is executed!!!';
};
require('make-runnable');
