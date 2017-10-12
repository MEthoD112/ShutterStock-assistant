const fs = require('fs');
const hamming = require('hamming-distance');

module.exports.compare = function () {
    const now = Date.now();
    const results = [];

    fs.readFile('./data/previewsWithHash.json','utf8', function (err, data) {
        const previews = JSON.parse(data);

    });
    return 'Compare images hashes is executed';
    //     const dist = hamming(results[0], results[1]);
    //     if (dist <= 17) {
    //       console.log('Images are similar');
    //     } else {
    //       console.log('Images are NOT similar');
    //     }
    //     console.log(Date.now() - now);
    //   })
  };
  require('make-runnable');
