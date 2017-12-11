const fs = require('fs-then');
const tress = require('tress');
const logger = require('./logger');

module.exports = {
    parseArrayData: arrayData => arrayData ? JSON.parse(arrayData) : [],
    writeToFileSync: (path, results) => fs.writeFileSync(path, JSON.stringify(results, null, 4)),
    readFile: path => fs.readFile(path, 'utf8'),
    createWriteStream: path => fs.createWriteStream(path),
    handleInQueue: (items, handleItem, threadsCount) => {
        return new Promise((resolve, reject) => {
          const queue = tress(handleItem, threadsCount);
      
          if (!items.length) {
            resolve(logger.log('All previews are downloaded!!!'));
          } else {
            queue.drain = resolve;
            items.forEach(item => queue.push(item));
          }
        });
      }
}