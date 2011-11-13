var options = require('./options');
var redis = require('redis');
if (options.env == 'production') { 
  var createRedisClient = function() {
      var db = redis.createClient(9034, 'carp.redistogo.com'); 
      var dbAuth=function() { db.auth('2ac23e223b531f90263935c0f6ff4a1e');};
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