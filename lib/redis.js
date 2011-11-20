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
  //url: redis://root:lGpDSE8IXn5pU9nFTSpP@modules-CBNX5MBM.dotcloud.com:3187
  exports.redis = createRedisClient(3187,'modules-CBNX5MBM.dotcloud.com','lGpDSE8IXn5pU9nFTSpP');
} else { 
   exports.redis = redis.createClient();
}