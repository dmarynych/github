var https = require('https'),
    redis = require("redis"),
    client = redis.createClient();

var Github = function () {
    this.limit = null;
    this.limitLeft = null;

    this.token = '';


    this.query = function (path, params, callback) {
        // first, check cache
        client.hget('ghcache', path, function (err, res) {
            if(!res) {
                this.httpQuery(path, params, function (res) {
                    client.hset('ghcache', path, JSON.stringify(res), function () {
                        callback(null, JSON.parse(res.body));
                    });
                });
            }
            else {
                var cachedVal = JSON.parse(res);
                params.etag = cachedVal.headers.etag;
                
                this.httpQuery(path, params, function (httpRes) {
                    if(httpRes.statusCode === 304) {
                        callback(null, JSON.parse(cachedVal.body));
                    }
                    else {
                        callback(null, JSON.parse(httpRes.body));
                        client.hset('ghcache', path, JSON.stringify(httpRes));
                    }



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

        //console.log(options);
        https.get(options, function(res) {
            this.limit = res.headers['x-ratelimit-limit'];
            this.limitLeft = res.headers['x-ratelimit-remaining'];

            if(res.statusCode === 304) {
                callback({
                    statusCode: res.statusCode,
                    body: null,
                    headers: res.headers
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

            }
            .bind(this))
            .on('error', function(e) {
                console.log("Got error: " + e.message);
            });
    }
};


module.exports = Github;