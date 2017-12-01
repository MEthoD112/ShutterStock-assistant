const fs = require('fs');
const needle = require('needle');
const cheerio = require('cheerio');
const tress = require('tress');
const _ = require('lodash');
const now = Date.now();

function parseIdFromUrl(url) {
  return url.slice(url.lastIndexOf('-') + 1, url.lastIndexOf('.'));
}

function getPageUrl(pageNumber) {
  return `https://www.shutterstock.com/ru/g/malyshevoleg?search_source=base_gallery&sort=newest&page=${pageNumber}`;
}

function getPageNumber(url) {
  return url.slice(url.lastIndexOf('=') + 1);
}

function drain(parseResults, previousResults) {
  if (!previousResults.length) writeResultsToJson('./data/previewsLinksDiff.json', parseResults);
  writeResultsToJson('./data/previewsLinks.json', parseResults);
  console.log('Parsed links total: ' + parseResults.length);
  console.log('Parsing time: ' + (Date.now() - now) / 1000 + ' seconds');
  console.log('Parsing is complited!!!');
}

function addResults(results, resultsForAdding) {
  return results.push(...resultsForAdding);
}

function writeResultsToJson(url, parseResults) {
  fs.writeFileSync(url, JSON.stringify(parseResults, null, 4));
}

function stopParsing(pagesParsingQueue, parseResults, previousResults) {
  pagesParsingQueue.kill();
  drain(parseResults, previousResults);
  return false;
}

function isReparseNeeded(resultsForPage, parseResults, url, lastPageNumber, pagesParsingQueue, isLinkFromPreviousParseReached) {
  if (resultsForPage.length !== 100 && getPageNumber(url) !== `${lastPageNumber}` && !isLinkFromPreviousParseReached) {
    console.log(`Reparse page ${getPageNumber(url)}`);
    pagesParsingQueue.unshift(url);
  } else if (!isLinkFromPreviousParseReached) {
    console.log(`Parse ${resultsForPage.length} links from page ${getPageNumber(url)}`);
    addResults(parseResults, resultsForPage);
    console.log('Parsed links on current moment: ' + parseResults.length);
  }
}

function isLastLinkFromPreviousParseReached(previousResults, id) {
  return _.find(previousResults, { id: id });
}

function prepareForStopParsing(previousResults, parseResults, resultsForPage, pagesParsingQueue) {
  addResults(parseResults, resultsForPage);
  writeResultsToJson('./data/previewsLinksDiff.json', parseResults);
  addResults(parseResults, previousResults);
  return stopParsing(pagesParsingQueue, parseResults, previousResults);
}

function parsePage(pagesParsingQueue, url, parseResults, previousResults, isLinkFromPreviousParseReached, callback) {
  needle.get(url, (err, res) => {
    const resultsForPage = [];
    const $ = cheerio.load(res.body);
    $('.search-results-grid li').each(function () {
      const imageUrl = $(this).find('img').attr('src');
      const id = parseIdFromUrl(imageUrl);

      if (isLastLinkFromPreviousParseReached(previousResults, id)) {
        isLinkFromPreviousParseReached = true;
        return prepareForStopParsing(previousResults, parseResults, resultsForPage, pagesParsingQueue);
      } else {
        resultsForPage.push({ id: id, imageUrl: imageUrl });
      }
    });
    const lastPageNumber = parseLastPageNumber(res);
    isReparseNeeded(resultsForPage, parseResults, url, lastPageNumber, pagesParsingQueue, isLinkFromPreviousParseReached);
    callback();
  });
}

function fullFillPagesParsingQueue(pagesParsingQueue, lastPageNumber) {
  for (let i = 1; i <= lastPageNumber; i++) {
    pagesParsingQueue.push(getPageUrl(i));
  }
}

function parseLastPageNumber(response) {
  const $ = cheerio.load(response.body);
  return parseInt($('.page-max').html());
}

function getPageCountAsync(pagesParsingQueue, fullFillPagesParsingQueue) {
  needle.get(getPageUrl(1), (err, res) => {
    if (err) console.log(err);
    const lastPageNumber = parseLastPageNumber(res);
    fullFillPagesParsingQueue(pagesParsingQueue, lastPageNumber)
  });
}

function parsePortfolio(previousResults) {
  let parseResults = [];
  let isLinkFromPreviousParseReached = false;
  const pagesParsingQueueThreadsNumber = 1;

  const pagesParsingQueue = tress((url, callback) => {
    parsePage(pagesParsingQueue, url, parseResults, previousResults, isLinkFromPreviousParseReached, callback);
  }, pagesParsingQueueThreadsNumber);

  getPageCountAsync(pagesParsingQueue, fullFillPagesParsingQueue);

  pagesParsingQueue.drain = function() {
    if (!previousResults.length) writeResultsToJson('./data/previewsLinksDiff.json', parseResults);
    writeResultsToJson('./data/previewsLinks.json', parseResults);
    console.log('Parsed links total: ' + parseResults.length);
    console.log('Parsing time: ' + (Date.now() - now) / 1000 + ' seconds');
    console.log('Parsing is complited!!!');
  };
}

module.exports.parseLinks = function () {
  fs.readFile('./data/previewsLinks.json', 'utf8', (err, previews) => {
    const previousResults = previews ? JSON.parse(previews) : [];
    parsePortfolio(previousResults);
  });
  return 'ShutterStock Previews Links Parsing is executed!!!';
};
require('make-runnable');
