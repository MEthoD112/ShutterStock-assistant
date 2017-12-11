const fs = require('fs-then');
const Jimp = require('jimp');

(() => {
    //const now = Date.now();
    Jimp.read('./images/1.jpg')
        .then(image => {
            //console.log((Date.now() - now) / 1000 + ' seconds');
            Jimp.read('./previews/556032451.jpg')
                .then(preview => {

                    var diff = Jimp.diff(image, preview);
                    console.log(diff);
                })
        });
})()