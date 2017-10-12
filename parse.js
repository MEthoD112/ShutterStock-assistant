const fs = require('fs');
const request = require('request');
const needle = require('needle');
const cheerio = require('cheerio');
const tress = require('tress');

function download(url, fileName, callback) {
  request.head('https:' + url, function (err, res, body) {
    request('https:' + url).pipe(fs.createWriteStream('./previews/' + fileName + '.jpg')).on('close', callback);
  });
};

function parseIdFromUrl(url) {
  return url.slice(url.lastIndexOf('-') + 1, url.lastIndexOf('.')) + Math.random().toFixed(2);
}

module.exports.parse = function () {
  const URL = 'https://www.shutterstock.com/ru/g/malyshevoleg?search_source=base_gallery&language=ru&page=1';
  let results = [];
  let maxPageCount;
  const now = Date.now();

  const q = tress(function (url, callback) {

    needle.get(url, function (err, res) {
      if (err) console.log(err);

      const $ = cheerio.load(res.body);

      if (!maxPageCount) {
        maxPageCount = parseInt($('.page-max').html());
        for (let i = 2; i <= maxPageCount; i++) {
          q.push(URL.slice(0, URL.length - 1) + i);
        }
      }
      const objects = [];
      $('.search-results-grid').children('li').each(function () {
        const imageUrl = $(this).find('img').attr('src');
        const id = parseIdFromUrl(imageUrl);
        objects.push({ id: id, imageUrl: imageUrl });
      });
      callback(null, (function () {
        results = results.concat(objects);
        console.log('Parsed links: ' + results.length);
      }()));
    });
  }, 15);

  q.drain = function () {
    fs.writeFileSync('./data/previews.json', JSON.stringify(results, null, 4));
    console.log('Downloading Previews is executed!!!');

    const que = tress(function (image, callback) {
      download(image.imageUrl, image.id, function () {
        console.log('Downloading ' + image.id);
        callback()
      });
    }, 15);

    que.drain = function () {
      console.log('Downloading is completed!!!');
      console.log('Executed time: ' + (Date.now() - now));
    }

    for (let i = 0; i < results.length; i++) {
      que.push(results[i]);
    }
  }
  q.push(URL);
  return 'ShutterStock Images Links Parsing is executed!!!';
};
require('make-runnable');
