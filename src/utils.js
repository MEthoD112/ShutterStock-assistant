const fs = require('fs-then');
const tress = require('tress');
const logger = require('./logger');

module.exports = {
    parseArrayData: arrayData => arrayData ? JSON.parse(arrayData) : [],
    readFile: path => fs.readFile(path, 'utf8'),
    readDir: dir => fs.readdirSync(dir),
    statSync: path => fs.statSync(path),
    writeToFileSync: (url, results) => fs.writeFileSync(url, JSON.stringify(results, null, 4)),
    writeFile: (path, content) => fs.writeFile(path, content),
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
    },
    Queue: class { 
        constructor(items, handleItem, threadsCount) {
          this.items = items;
          this.handleItem = handleItem; 
          this.queue = tress(handleItem, threadsCount);
        }     
        fullfillQueue() {
          const self = this; 
          return new Promise((resolve, reject) => {
            if (!self.items.length) {
              resolve(logger.log('All items are got!!!'));
            } else {
              self.queue.drain = () => resolve(self.queue);
              self.items.forEach(item => self.queue.push(item));
            }
          });
        }   
    }
}