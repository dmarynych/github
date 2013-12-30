var Github = require('./index.js');

var github = new Github();

github.query('/users/dmarynych', {}, function (err,user) {
    console.log(user.login +', limit: '+ github.limitLeft +'/'+ github.limit);
});