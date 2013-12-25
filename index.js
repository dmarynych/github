var https = require('https'),
    redis = require("redis"),
    client = redis.createClient();

var Github = function () {
    this.token = '';


    this.query = function (path, params, callback) {
        // first, check cache
        client.hget('ghcache', path, function (err, res) {
            console.log('res', res);

            if(!res) {
                console.log('do query');
                this.httpQuery(path, params, function (res) {
                    client.hset('ghcache', path, JSON.stringify(res), function () {
                        callback(res);
                    });
                });
            }
            else {
                console.log('cache');
                var cachedVal = JSON.parse(res);
                console.log(cachedVal);
                params.etag = cachedVal.headers.etag;
                
                this.httpQuery(path, params, function (res) {
                    console.log('done');
                    if(res.statusCode === 304) {
                        console.log('etag cache');

                        callback(cachedVal);
                    }
                    else {
                        console.log('cache invalideted');
                        callback(res);
                    }


                    client.hset('ghcache', path, JSON.stringify(res));
                });
                //callback(obj);
            }

        }.bind(this));
    };

    this.httpQuery = function (path, params, callback) {
        var options = {
            hostname: 'api.github.com',
            port: 443,
            path: path,
            headers: {
                'User-Agent': 'nodejs'
                //'If-None-Match': '"de8ea5d318a97df871f1c310cc14a048"'
            }
        };
        if(params.etag) {
            options.headers['If-None-Match'] = params.etag;
        }

        console.log(options);
        https.get(options, function(res) {
            console.log(res.statusCode);

            if(res.statusCode === 304) {
                callback({
                    statusCode: res.statusCode
                });
            }
            else {
                res.on('data', function (chunk) {
                    callback({
                        statusCode: res.statusCode,
                        body: chunk.toString('utf8'),
                        headers: res.headers
                    });
                });
            }

        }).on('error', function(e) {
                console.log("Got error: " + e.message);
            });
    }
};


var github = new Github();

github.query('/users/dmarynych', {}, function (res) {
    console.log(res);
});