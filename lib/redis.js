var options = require('./options');
var redis = require('redis');
if (options.env == 'production') { 
  var createRedisClient = function() {
      var db = redis.createClient(PORT, HOST); 
      var dbAuth=function() { db.auth(PASSWORD);};
      db.addListener('connected',dbAuth);
      db.addListener('reconnected',dbAuth);
      db.on("error", function (err) {
            console.log((err).red);
        });
      dbAuth();
      return db;
  };
  exports.redis = createRedisClient();
} else { 
   exports.redis = redis.createClient();
}