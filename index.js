var https = require('https'),
    redis = require("redis"),
    querystring = require('querystring'),
    client = redis.createClient();

var Github = function (options) {
    this.limit = null;
    this.limitLeft = null;

    this.token = options.token ? options.token : null;



    this.query = function (path, params, callback) {
        var page = params.page || 0,
            per_page = params.per_page || 100,
            paramsStr = querystring.stringify({
                page: page,
                per_page: per_page
            });
        path = '/'+ path +'?'+ paramsStr;
        
        console.log(path);


        // first, check cache
        client.hget('ghcache', path, function (err, res) {
            if(!res || res == 'null') {
                this.httpQuery(path, params, function (err, res) {
                    if(err) callback(err);
                    
                    client.hset('ghcache', path, JSON.stringify(res), function () {
                        callback(null, JSON.parse(res.body));
                    });
                });
            }
            else {
                var cachedVal;

                try {
                    cachedVal = JSON.parse(res);
                }
                catch(e) {
                    callback('JSON parse error');
                }
                finally {
                    if(!cachedVal) {
                        callback('JSON parse error');
                    }

                    params.etag = cachedVal.headers.etag;

                    this.httpQuery(path, params, function (err, httpRes) {
                        if(err) callback(err);

                        if(httpRes.statusCode === 304) {
                            callback(null, JSON.parse(cachedVal.body));
                        }
                        else {
                            callback(null, JSON.parse(httpRes.body));
                            client.hset('ghcache', path, JSON.stringify(httpRes));
                        }
                    });
                }


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
            }
        };
        if(params.etag) {
            options.headers['If-None-Match'] = params.etag;
        }
        if(this.token) {
            options.headers['Authorization'] = 'token '+ this.token
        }

        //console.log(options);
        var req = https.get(options, function(res) {
            this.limit = res.headers['x-ratelimit-limit'];
            this.limitLeft = res.headers['x-ratelimit-remaining'];

            if(res.statusCode === 304) {
                callback(null, {
                    statusCode: res.statusCode,
                    body: null,
                    headers: res.headers
                });
            }
            else {
                var result = "";
                res.on('data', function (chunk) {
                    result += chunk;
                });

                res.on('end', function(){
                    callback(null, {
                        statusCode: res.statusCode,
                        body: result,
                        headers: res.headers
                    });
                });
            }

            }
            .bind(this))
            .on('error', function(e) {
                console.log("Got error: " + e.message);
                callback(e.message);
            });

            req.setTimeout(3000, function() {
                callback('https timeout');
            });

    }
};


module.exports = Github;
