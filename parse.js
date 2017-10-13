const fs = require('fs');
const needle = require('needle');
const cheerio = require('cheerio');
const tress = require('tress');

function parseIdFromUrl(url) {
  return url.slice(url.lastIndexOf('-') + 1, url.lastIndexOf('.')) + (Math.random() * 100).toFixed(0);
}

module.exports.parse = function () {
  const URL = 'https://www.shutterstock.com/ru/g/malyshevoleg?search_source=base_gallery&language=ru&page=1';
  let parseResults = [];
  let maxPageCount;
  const pagesParsingQueueThreadsNumber = 3;
  const now = Date.now();

  const pagesParsingQueue = tress(function (url, callback) {
    parsePage(pagesParsingQueue, url, callback);
  }, pagesParsingQueueThreadsNumber);


  function fullfilPagesParsingQueue() {
    needle.get(URL, function (err, res) {
      if (err) console.log(err);
      const $ = cheerio.load(res.body);

      if (!maxPageCount) {
        maxPageCount = parseInt($('.page-max').html());
        for (let i = 1; i <= maxPageCount; i++) {
          pagesParsingQueue.push(URL.slice(0, URL.length - 1) + i);
        }
      }
    })
  };

  function parsePage(pagesParsingQueue, url, callback) {
    needle.get(url, function (err, res) {
      const objects = [];
      const $ = cheerio.load(res.body);
      $('.search-results-grid li').each(function () {
        const imageUrl = $(this).find('img').attr('src');
        const id = parseIdFromUrl(imageUrl);
        objects.push({ id: id, imageUrl: imageUrl });
      });
      parseResults = parseResults.concat(objects);
      console.log('Parsed links: ' + parseResults.length);
      callback(null, undefined);
    });
  }

  pagesParsingQueue.drain = function () {
    fs.writeFileSync('./data/previews.json', JSON.stringify(parseResults, null, 4));
    console.log('Parsing time: ' + (Date.now() - now));
    console.log('Parsing is complited!!!');
  }

  fullfilPagesParsingQueue();

  return 'ShutterStock Images Links Parsing is executed!!!';
};
require('make-runnable');
