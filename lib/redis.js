var options = require('./options');
var redis = require('redis');
if (options.env == 'production') { 
  var createRedisClient = function(port, host, auth) {
      var db = redis.createClient(port, host); 
      var dbAuth=function() { db.auth(auth);};
      db.addListener('connected',dbAuth);
      db.addListener('reconnected',dbAuth);
      db.on("error", function (err) {
            console.log((err).red);
        });
      dbAuth();
      return db;
  };
  
  exports.redis = createRedisClient(3187,HOST);
} else { 
   exports.redis = redis.createClient();
}