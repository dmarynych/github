var https = require('https');

var Github = function () {
    this.token = '';


    this.query = function (path, params, callback) {
        var options = {
            hostname: 'api.github.com',
            port: 443,
            path: path,
            headers: {
                'User-Agent': 'nodejs',
                'If-None-Match': '"de8ea5d318a97df871f1c310cc14a048"'
            }
        };
        console.log(options);
        https.get(options, function(res) {
            console.log(res.statusCode);

            res.on('data', function (chunk) {
                callback(chunk.toString('utf8'), res.headers);
            });


        }).on('error', function(e) {
            console.log("Got error: " + e.message);
        });
    }
};


var github = new Github();

github.query('/users/dmarynych', {}, function (res, headers) {
    console.log(res.statusCode);
    console.log(headers);
});