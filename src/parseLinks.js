const fs = require('fs-then');
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

function drain(parseResults, previousResults, resolve) {
  if (!previousResults.length) writeResultsToJson('./data/previewsLinksDiff.json', parseResults);
  writeResultsToJson('./data/previewsLinks.json', parseResults);
  console.log('Parsed links total: ' + parseResults.length);
  console.log('Parsing time: ' + (Date.now() - now) / 1000 + ' seconds');
  resolve(console.log('Parsing is complited!!!'));
}

function addResults(results, resultsForAdding) {
  return results.push(...resultsForAdding);
}

function writeResultsToJson(url, parseResults) {
  fs.writeFileSync(url, JSON.stringify(parseResults, null, 4));
}

function stopParsing(pagesParsingQueue, parseResults, previousResults, resolve) {
  pagesParsingQueue.kill();
  drain(parseResults, previousResults, resolve);
  return false;
}

function isReparseNeeded(resultsForPage, parseResults, url, lastPageNumber, pagesParsingQueue, isLinkFromPreviousParseReached) {
  if (resultsForPage.length !== 100 && getPageNumber(url) !== `${lastPageNumber}` && !isLinkFromPreviousParseReached.length && getPageNumber(url) !== '1') {
    console.log(`Reparse page ${getPageNumber(url)}`);
    pagesParsingQueue.unshift(url);
  } else if (!isLinkFromPreviousParseReached.length) {
    console.log(`Parse ${resultsForPage.length} links from page ${getPageNumber(url)}`);
    addResults(parseResults, resultsForPage);
    console.log('Parsed links on current moment: ' + parseResults.length);
  }
}

function isLastLinkFromPreviousParseReached(previousResults, id, isLinkFromPreviousParseReached) {
  return _.find(previousResults, { id: id }) ? isLinkFromPreviousParseReached.push(1) : false;
}

function prepareForStopParsing(previousResults, parseResults, resultsForPage, pagesParsingQueue, resolve) {
  addResults(parseResults, resultsForPage);
  writeResultsToJson('./data/previewsLinksDiff.json', parseResults);
  addResults(parseResults, previousResults);
  return stopParsing(pagesParsingQueue, parseResults, previousResults, resolve);
}

function parsePage(response, previousResults, isLinkFromPreviousParseReached, parseResults, resultsForPage, pagesParsingQueue, resolve) {
  const $ = cheerio.load(response.body);
  $('.search-results-grid li').each(function () {
    const imageUrl = $(this).find('img').attr('src');
    const id = parseIdFromUrl(imageUrl);
    if (isLastLinkFromPreviousParseReached(previousResults, id, isLinkFromPreviousParseReached)) {
      return prepareForStopParsing(previousResults, parseResults, resultsForPage, pagesParsingQueue, resolve);
    } else {
      resultsForPage.push({ id: id, imageUrl: `https:${imageUrl}` });
    }
  });
}

function getPageAsync(pagesParsingQueue, url, parseResults, previousResults, isLinkFromPreviousParseReached, callback, resolve) {
  needle('get', url)
    .then(response => {
      const resultsForPage = [];
      parsePage(response, previousResults, isLinkFromPreviousParseReached, parseResults, resultsForPage, pagesParsingQueue, resolve);
      const lastPageNumber = parseLastPageNumber(response);
      isReparseNeeded(resultsForPage, parseResults, url, lastPageNumber, pagesParsingQueue, isLinkFromPreviousParseReached);
      callback();
    })
    .catch(err => callback(null, console.error(err)));
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
  needle('get', getPageUrl(1))
    .then(response => {
      const lastPageNumber = parseLastPageNumber(response);
      fullFillPagesParsingQueue(pagesParsingQueue, lastPageNumber)
    })
    .catch(err => console.error(err));
}

function parsePortfolio(previousResults, resolve) {
  let parseResults = [];
  let isLinkFromPreviousParseReached = [];

  const pagesParsingQueue = tress((url, callback) => {
    getPageAsync(pagesParsingQueue, url, parseResults, previousResults, isLinkFromPreviousParseReached, callback, resolve);
  }, 1);

  getPageCountAsync(pagesParsingQueue, fullFillPagesParsingQueue);

  pagesParsingQueue.drain = function () {
    if (!previousResults.length) writeResultsToJson('./data/previewsLinksDiff.json', parseResults);
    writeResultsToJson('./data/previewsLinks.json', parseResults);
    console.log('Parsed links total: ' + parseResults.length);
    console.log('Parsing time: ' + (Date.now() - now) / 1000 + ' seconds');
    resolve(console.log('Parsing is complited!!!'));
  };
}

module.exports = function () {
  console.log('ShutterStock Previews Links Parsing is executed!!!');
  return new Promise((resolve, reject) => {
    fs.readFile('./data/previewsLinks.json', 'utf8')
      .then(previews => {
        const previousResults = previews ? JSON.parse(previews) : [];
        parsePortfolio(previousResults, resolve);
      }, err => reject(console.error(err)));
  });
};
