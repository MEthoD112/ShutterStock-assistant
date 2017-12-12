const fs = require('fs-then');
const tress = require('tress');
const logger = require('./logger');

module.exports = {
    parseArrayData: arrayData => arrayData ? JSON.parse(arrayData) : [],
    writeToFileSync: (path, results) => fs.writeFileSync(path, JSON.stringify(results, null, 4)),
    readFile: path => fs.readFile(path, 'utf8'),
    readDir: dir => fs.readdirSync(dir),
    statSync: path => fs.statSync(path),
    writeToJsonSync: (url, results) => fs.writeFileSync(url, JSON.stringify(results, null, 4)),
    createWriteStream: path => fs.createWriteStream(path),
    handleInQueue: (items, handleItem, threadsCount) => {
        return new Promise((resolve, reject) => {
          const queue = tress(handleItem, threadsCount);
          if (!items.length) {
            resolve(logger.log('All items are got!!!'));
          } else {
            queue.drain = resolve;
            items.forEach(item => queue.push(item));
          }
        });
      }
}