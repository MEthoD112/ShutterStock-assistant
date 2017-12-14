const needle = require('needle');
const cheerio = require('cheerio');
const _ = require('lodash');
const logger = require('./logger');
const utils = require('./utils');
const constants = require('./constants');

let parseResults = [];
let previousResults = [];
let isLinkFromPreviousParseReached = false;
let queue;

function parseIdFromUrl(url) {
  return url.slice(url.lastIndexOf('-') + 1, url.lastIndexOf('.'));
}

function getPageUrl(pageNumber) {
  return `https://www.shutterstock.com/g/${constants.portfolioAuthorName}?search_source=base_gallery&language=en&sort=newest&image_type=vector&safe=true&page=${pageNumber}`;
}

function getPageNumber(url) {
  return url.slice(url.lastIndexOf('=') + 1);
}

function isReparseNeeded(resultsForPage, url, lastPageNumber) {
  if (resultsForPage.length !== constants.maxPreviewsForPage && 
      getPageNumber(url) !== `${lastPageNumber}` && 
      !isLinkFromPreviousParseReached && 
      getPageNumber(url) !== '1') {

    logger.log(`Reparse page ${getPageNumber(url)}`);
    queue.queue.unshift(url);
  } else if (!isLinkFromPreviousParseReached) {
    logger.log(`Parse ${resultsForPage.length} links from page ${getPageNumber(url)}`);
    parseResults.push(...resultsForPage);
    logger.log('Parsed links on current moment: ' + parseResults.length);
  }
}

function isLastLinkFromPreviousParseReached(id) {
  return _.find(previousResults, { id: id }) ? isLinkFromPreviousParseReached = true : false;
}

function parsePage(response, resultsForPage) {
  const $ = cheerio.load(response.body);
  $('.search-results-grid li').each(function () {
    const imageUrl = $(this).find('img').attr('src');
    const id = parseIdFromUrl(imageUrl);
    if (isLastLinkFromPreviousParseReached(id)) {
      parseResults.push(...resultsForPage);
      _.remove(queue.queue.waiting, item => item.data);
      return false;
    } else {
      resultsForPage.push({ id, imageUrl: `https:${imageUrl}` });
    }
  });
}

function getPageAsync(url, callback) {
  needle('get', url)
    .then(response => {
      const resultsForPage = [];
      parsePage(response, resultsForPage);
      const lastPageNumber = parseLastPageNumber(response);
      isReparseNeeded(resultsForPage, url, lastPageNumber);
      callback();
    })
    .catch(err => callback(null, () => {logger.error(err); queue.queue.unshift(url)}));
}

function parseLastPageNumber(response) {
  const $ = cheerio.load(response.body);
  return parseInt($('.page-max').html());
}

function getPageCountAsync() {
  return new Promise((resolve, reject) => {
    needle('get', getPageUrl(1))
      .then(response => {
        const lastPageNumber = parseLastPageNumber(response);
        resolve(lastPageNumber);
      })
      .catch(err => reject(logger.error(err)));
  });  
}

function parsePortfolio(urls) {
  queue = new utils.Queue(urls, getPageAsync, constants.parseLinksThreads);
  return queue.fullfillQueue();
}

module.exports = () => {
  const now = Date.now();
  logger.log('ShutterStock Previews Links Parsing is executed!!!');
  return new Promise((resolve, reject) => {
    Promise.all([getPageCountAsync(), utils.readFile('./data/previewsLinks.json')])
      .then(data => {
        const range = _.range(1, +data[0] + 1);
        const urls = _.map(range, item => getPageUrl(item));
        previousResults = utils.parseArrayData(data[1]);
        return parsePortfolio(urls);
      })
      .then(() => {
        if (!previousResults.length) {
          utils.writeToFileSync('./data/previewsLinksDiff.json', parseResults);
          utils.writeToFileSync('./data/previewsLinks.json', parseResults);
          logger.log('Parsed links total: ' + parseResults.length);
        } else {
          utils.writeToFileSync('./data/previewsLinksDiff.json', parseResults);
          logger.log('Parsed links already got: ' + previousResults.length);
          previousResults.push(...parseResults);
          utils.writeToFileSync('./data/previewsLinks.json', previousResults);
          logger.log('Parsed links now: ' + parseResults.length);
          logger.log('Parsed links total: ' + previousResults.length);
        }  
        logger.log('Parsing time: ' + (Date.now() - now) / 1000 + ' seconds');
        resolve(logger.log('Parsing is complited!!!'));
      }, err => reject(logger.error(err)));
  });
};

