const logger = require('./logger');
const utils = require('./utils');
const _ = require('lodash');

module.exports = () => {
    logger.log('Getting relevant results is executed!!!')
    return new Promise((resolve, reject) => {
        utils.readFile('./data/map.json')
            .then(mappedJson => {
                const mapped = utils.parseArrayData(mappedJson);
                const relevantResults = [];
                const group = _.groupBy(mapped, 'image.path');
                _.forIn(group, value => {
                    value = _.sortBy(value, ['pixelMatchDiff']);
                    relevantResults.push(value[0]);
                });
                utils.writeToFileSync('./data/map.json', relevantResults); 
                resolve(logger.log('Getting relevant results is complited!!!')); 
            }, err => reject(logger.error(err)));
    })
    
};