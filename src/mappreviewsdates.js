const _ = require('lodash');
const moment = require('moment');
const logger = require('./logger');
const utils = require('./utils');
const constants = require('./constants');


function getMileseconds(date) {
    const defaultTime = moment(constants.dateForGettinfDiff);
    return date ? moment(date).diff(defaultTime) : null;
}

module.exports = () => {
    logger.log('Previews dates mapping is executed!!!');
    return new Promise((resolve, rejecet) => {
        Promise.all([utils.readFile('./data/previewsWithHash.json'), utils.readFile('./data/downloadPreviews.json')])
            .then(data => {
                let previewsWithHash = utils.parseArrayData(data[0]);
                const previewsWithDate = utils.parseArrayData(data[1]);
                _.map(previewsWithHash, preview => { 
                    preview.date = getMileseconds(_.find(previewsWithDate, { id: preview.id }).lastModified) 
                });
                previewsWithHash = _.sortBy(previewsWithHash, ['date']);
                utils.writeToFileSync('./data/previewsWithHash.json', previewsWithHash);
                resolve(logger.log('Previews dates mapping is completed!!!'))
            }, err => reject(logger.error(err)));
    })
}