var Github = require('./index.js');

var github = new Github({
    token: '699c83f3337b9d2e70d4f807925b10b5dc707051'
});

github.query('/users/dmarynych', {}, function (err,user) {
    console.log(user.login +', limit: '+ github.limitLeft +'/'+ github.limit);
});