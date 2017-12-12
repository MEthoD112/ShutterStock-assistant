const needle = require('needle');
const cheerio = require('cheerio');
const tress = require('tress');
const _ = require('lodash');
const logger = require('./logger');
const utils = require('./utils');

let parseResults = [];
let isLinkFromPreviousParseReached = [];

function parseIdFromUrl(url) {
  return url.slice(url.lastIndexOf('-') + 1, url.lastIndexOf('.'));
}

function getPageUrl(pageNumber) {
  return `https://www.shutterstock.com/ru/g/malyshevoleg?search_source=base_gallery&sort=newest&page=${pageNumber}`;
}

function getPageNumber(url) {
  return url.slice(url.lastIndexOf('=') + 1);
}

function drain(previousResults, resolve) {
  if (!previousResults.length) utils.writeToJsonSync('./data/previewsLinksDiff.json', parseResults);
  utils.writeToJsonSync('./data/previewsLinks.json', parseResults);
  logger.log('Parsed links total: ' + parseResults.length);
  resolve(logger.log('Parsing is complited!!!'));
}

function addResults(results, resultsForAdding) {
  return results.push(...resultsForAdding);
}

function stopParsing(pagesParsingQueue, previousResults, resolve) {
  pagesParsingQueue.kill();
  drain(previousResults, resolve);
  return false;
}

function isReparseNeeded(resultsForPage, url, lastPageNumber, pagesParsingQueue) {
  if (resultsForPage.length !== 100 && getPageNumber(url) !== `${lastPageNumber}` && !isLinkFromPreviousParseReached.length && getPageNumber(url) !== '1') {
    logger.log(`Reparse page ${getPageNumber(url)}`);
    pagesParsingQueue.unshift(url);
  } else if (!isLinkFromPreviousParseReached.length) {
    logger.log(`Parse ${resultsForPage.length} links from page ${getPageNumber(url)}`);
    addResults(parseResults, resultsForPage);
    logger.log('Parsed links on current moment: ' + parseResults.length);
  }
}

function isLastLinkFromPreviousParseReached(previousResults, id) {
  return _.find(previousResults, { id: id }) ? isLinkFromPreviousParseReached.push(1) : false;
}

function prepareForStopParsing(previousResults, resultsForPage, pagesParsingQueue, resolve) {
  addResults(parseResults, resultsForPage);
  utils.writeToJsonSync('./data/previewsLinksDiff.json', parseResults);
  addResults(parseResults, previousResults);
  return stopParsing(pagesParsingQueue, previousResults, resolve);
}

function parsePage(response, previousResults, resultsForPage, pagesParsingQueue, resolve) {
  const $ = cheerio.load(response.body);
  $('.search-results-grid li').each(function () {
    const imageUrl = $(this).find('img').attr('src');
    const id = parseIdFromUrl(imageUrl);
    if (isLastLinkFromPreviousParseReached(previousResults, id)) {
      return prepareForStopParsing(previousResults, resultsForPage, pagesParsingQueue, resolve);
    } else {
      resultsForPage.push({ id: id, imageUrl: `https:${imageUrl}` });
    }
  });
}

function getPageAsync(pagesParsingQueue, url, previousResults, callback, resolve) {
  needle('get', url)
    .then(response => {
      const resultsForPage = [];
      parsePage(response, previousResults, resultsForPage, pagesParsingQueue, resolve);
      const lastPageNumber = parseLastPageNumber(response);
      isReparseNeeded(resultsForPage, url, lastPageNumber, pagesParsingQueue);
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
    .catch(err => logger.error(err));
}

function parsePortfolio(previousResults, resolve, now) {

  const pagesParsingQueue = tress((url, callback) => {
    getPageAsync(pagesParsingQueue, url, previousResults, callback, resolve);
  }, 1);

  getPageCountAsync(pagesParsingQueue, fullFillPagesParsingQueue);

  pagesParsingQueue.drain = () => {
    if (!previousResults.length) utils.writeToJsonSync('./data/previewsLinksDiff.json', parseResults);
    utils.writeToJsonSync('./data/previewsLinks.json', parseResults);
    logger.log('Parsed links total: ' + parseResults.length);
    logger.log('Parsing time: ' + (Date.now() - now) / 1000 + ' seconds');
    resolve(logger.log('Parsing is complited!!!'));
  };
}

module.exports = () => {
  const now = Date.now();
  logger.log('ShutterStock Previews Links Parsing is executed!!!');
  return new Promise((resolve, reject) => {
    utils.readFile('./data/previewsLinks.json')
      .then(previews => {
        const previousResults = utils.parseArrayData(previews);
        parsePortfolio(previousResults, resolve, now);
      }, err => reject(logger.error(err)));
  });
};
