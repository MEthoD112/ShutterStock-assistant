const fs = require('fs');
const needle = require('needle');
const cheerio = require('cheerio');
const tress = require('tress');
const _ = require('lodash');

const now = Date.now();
let previousResults, isExistingLink, lastPageLinksCount, lastPageNumber, parseResults = [];

function parseIdFromUrl(url) {
  return url.slice(url.lastIndexOf('-') + 1, url.lastIndexOf('.'));
}

function getPageUrl(pageNumber) {
  return `https://www.shutterstock.com/ru/g/malyshevoleg?search_source=base_gallery&sort=newest&page=${pageNumber}`;
}

function getPageNumber(url) {
  return url.slice(url.lastIndexOf('=') + 1);
}

function parseLastPageNumber(response) {
  const $ = cheerio.load(response.body);
  lastPageNumber = parseInt($('.page-max').html());
  // ToDo: return page count; Don't use global vars
}

function fullFillPagesParsingQueue(pagesParsingQueue) {
  for (let i = 1; i <= lastPageNumber; i++) {
    pagesParsingQueue.push(getPageUrl(i));
  }
}

function sendFirstPageRequest(pagesParsingQueue) {
  needle.get(getPageUrl(1), (err, res) => {
    if (err) console.log(err);
    parseLastPageNumber(res);
  });
}

function drain() {
  if (!previousResults.length) fs.writeFileSync('./data/previewsLinksDiff.json', JSON.stringify(parseResults, null, 4));
  fs.writeFileSync('./data/previewsLinks.json', JSON.stringify(parseResults, null, 4));
  console.log('Parsed links total: ' + parseResults.length);
  console.log('Parsing time: ' + (Date.now() - now) / 1000 + ' seconds');
  console.log('Parsing is complited!!!');
}

function isLinkExist(pagesParsingQueue, resultsForPage) {
  parseResults = parseResults.concat(resultsForPage);
  fs.writeFileSync('./data/previewsLinksDiff.json', JSON.stringify(parseResults, null, 4));
  parseResults = parseResults.concat(previousResults);
  isExistingLink = true;
  pagesParsingQueue.kill();
  drain();
  return false;
}

function isNewLink(resultsForPage, url) {
  if (!isExistingLink) {
    console.log(`Parse ${resultsForPage.length} links from page ${getPageNumber(url)}`);
    parseResults = parseResults.concat(resultsForPage);
    console.log('Parsed links on current moment: ' + parseResults.length);
  }
}

function isReparseNeeded(resultsForPage, url, pagesParsingQueue) {
  if (resultsForPage.length !== 100 && getPageNumber(url) !== `${lastPageNumber}` && !isExistingLink) {
    console.log(`Reparse page ${getPageNumber(url)}`);
    pagesParsingQueue.unshift(url);
  } else {
    isNewLink(resultsForPage, url);
  }
}

// function isLastImageFromPreviousParseReached = !!_.find(previousResults, { id: id });

function parsePage(pagesParsingQueue, url, callback) {
  needle.get(url, (err, res) => {
    const resultsForPage = [];
    const $ = cheerio.load(res.body);
    $('.search-results-grid li').each(function () {
      const imageUrl = $(this).find('img').attr('src');
      const id = parseIdFromUrl(imageUrl);
      if (_.find(previousResults, { id: id })) {
        /**
         * 
         */
        return isLinkExist(pagesParsingQueue, resultsForPage);
      } else {
        resultsForPage.push({ id: id, imageUrl: imageUrl });
      }
    });
    isReparseNeeded(resultsForPage, url, pagesParsingQueue);
    callback();
  });
}

// ToDo: remove queue from that function
// as we use a single thread
function parsePortfolio() {
  const pagesParsingQueueThreadsNumber = 1;
  const pagesParsingQueue = tress((url, callback) => {
    parsePage(pagesParsingQueue, url, callback);
  }, pagesParsingQueueThreadsNumber);

  /*
    getPageCountAsync(functoina(pageCound){

    })
  */
  sendFirstPageRequest(pagesParsingQueue);
  pagesParsingQueue.drain = drain;
}

module.exports.parseLinks = function () {
  fs.readFile('./data/previewsLinks.json', 'utf8', (err, previews) => {
    previousResults = previews ? JSON.parse(previews) : [];
    parsePortfolio();
  });
  return 'ShutterStock Previews Links Parsing is executed!!!';
};
require('make-runnable');
