/*
 * node-comm
 * Copyright (c) 2011 Alejandro Morales <vamg008@gmail.com>
 * MIT Licensed
 */

/* Change this for your own namespace */
const NAMESPACE = 'ncomm'; 
var redis = require('./redis').redis,
    url = require('url').parse,
    util = require('./utils.js').util;


/* threadKey
 * Defining the mask for process. Receive two arguments:
 * @id that is the page identifier for example: http://test.com/d/i/r/topath the id would be dirtopath
 * @parent is the hostname for of the page: i.e test.com
*/
var Comment = module.exports.Comment = function(comment){
  this.url = comment.url || 'home';
  this.data = comment.data || null;
  this.author = comment.data.author || 'Anon';
  this.date = new Date(Date.now());
  return this;
}
var threadKey = module.exports.newComment = function(id,parent) {
    return NAMESPACE + ':' + parent + ':' + id;
}

/* shortTKeys
 * Defining the mask for a site. Receive one argument:
 * @parent is the hostname for the page: i.e test.com
 * In redis is a hash
*/
var shortTKeys = module.exports.urlThreadKey = function(parent) {
  return NAMESPACE + ':' + parent;
}
/* convertURL(ur)
 * Convert url to only alphanumeric chars for redis key string support
 */ 
var convertURL = function(_url) {
  var host = url(_url).hostname,
      slug = url(_url).pathname;
      /* We don't want to make a key with a protocol that is not browser based (?) */
  return { host: host, slug: slug.replace(/[^\w \xC0-\xFF]/g,'') };
}
var slOff = function(_url){
  return _url.replace(/[^\w \xC0-\xFF]/g,'') ;
}
var toJSONString = function(val){
  val.comment = util.toStaticHTML(val.comment);
  return JSON.stringify(val)
};

/* Delete duplicate members */
Array.prototype.unique = function () {
  var r = new Array();
  o: for(var i = 0, n = this.length; i < n; i++){
    for(var x = 0, y = r.length; x < y; x++) {
      if(r[x]==this[i]) {
        continue o;
      }
    }
    r[r.length] = this[i];
  }
  return r;
}
/*
 * A new Comment has these params:
 * @url: Has the asociate url for the comment Box
 * @username: The username that post the comment
 * @reply: an Array that contains two values, a bolean that define if the comment is a reply and a commentId or null(by default)
 * @comment: the comment.
 * @id: Comment # id like 1,2,3,4
*/
/*
* A valid comment looks like this:
  { url:'http://numbus.co:8080/f/prueba/h', 
    comment: { authorId: "4ebef2c27f21bd298a000000", comment: "YOUR COMMENT",time: Date.now(), 
    parent: "URL parent or comment parent as reply" } } 
*/
Comment.prototype.validate = function(res){
  var log =[]
  try { 
    if (/^(http:\/\/)([\w]+\.){1,}[A-Z]{2,}\b/gi.test(this.url)){} else { log.push('Invalid URL');}
    if (this.data.comment.length<50) { log.push('The comment has to be at least 50 chars long')}
    if (!this.data.authorId) {log.push('I need a username')}
    if (log.length===0) {
      return true
    } else {
     return null;
    }
  } catch (e){
    return null;
  }
}
Comment.prototype.validateC = function(res){
  var log =[]
  try { 
    if (/^(http:\/\/)([\w]+\.){1,}[A-Z]{2,}\b/gi.test(this.url)){} else { log.push('Invalid URL');}
    if (this.data.comment.length<50) { log.push('The comment has to be at least 50 chars long')}
    if (!this.data.authorId) {log.push('I need a username')}
    if (log.length===0) {
      return true
    } else {
     return log;
    }
  } catch (e){
    return e;
  }
}
Comment.prototype.save = function(res){    
  var self = this;
    if (self.validate() != null) {
      var threadId = convertURL(this.url).slug || 'home',
          parent = convertURL(this.url).host;
          thread = threadKey(threadId,parent),
          redis.exists(thread, function(e,d){
            if (e) res('No ok: ' + e,null);
            redis.hincrby(thread,'id',1,function(e4,d4){
              redis.hincrby('u:' + self.data.authorId, 'id',1, function(error, data){
                 /* Setting up floating points */
                self.data.lid = data, self.data.id = d4;self.data.url = url(self.url).pathname;
                redis.multi()
                     .HSET('u:' + self.data.authorId, data, toJSONString(self.data))
                     .HSET(thread,d4, toJSONString(self.data))
                     .lpush(shortTKeys(parent),url(self.url).pathname)
                     .exec(function(e2,d2){
                       if (e2) res('No ok: ' + err, null)
                       res(null, d2)
                     });
              });
            });
          })
    } else {
        res(this.validate(), null)
    } 
}
Comment.prototype.delete = function(res){
  if (this.validate()){
    var threadId = convertURL(this.url).slug || 'home',
          parent = convertURL(this.url).host;
          thread = threadKey(threadId,parent),
          comment = this.data;
      redis.multi()
           .HDEL(thread, comment.id)
           .HDEL('u:'+ comment.authorId, comment.lid)
           .exec(function(e,d2){
             if (e) {
               res('No ok: ' + e, null)
             } else {
               res(null, 'ok')
             }
           });
  } else {
    res('Comment bad former')
  }
}

/*
var p = { url:'http://numbus.co:8080/f/prueba/h', 
    data: { authorId: "4ebef2c27f21bd298a000000", comment: "YOUR COMMENT",time: Date.now(), 
    parent: "URL parent or comment parent as reply" } } 

var c = new Comment(p)
console.log(c);
*/  
var newComment = module.exports.newComment = function(req,res) {
    var O = req;    
    /* the RegExp was a const but everytwo presented a bug */
    if (/^(http:\/\/)([\w]+\.){1,}[A-Z]{2,}\b/gi.test(O.url)) {
      var threadId = convertURL(O.url).slug || 'home',
          parent = convertURL(O.url).host;
          thread = threadKey(threadId,parent),
          redis.exists(thread, function(e,d){
            if (e) res('No ok: ' + e,null);
            redis.hincrby(thread,'id',1,function(e4,d4){
              redis.hincrby('u:' + O.data.authorId, 'id',1, function(error, data){
                 /* Setting up floating points */
                O.data.lid = data, O.data.id = d4;O.data.url = url(O.url).pathname;
                redis.multi()
                     .HSET('u:' + O.data.authorId, data, toJSONString(O.data))
                     .HSET(thread,d4, toJSONString(O.data))
                     .lpush(shortTKeys(parent),url(O.url).pathname)
                     .exec(function(e2,d2){
                       if (e2) res('No ok: ' + err, null)
                       res(null, d2)
                     });
              });
            });
          })
    } else {
        res('I need an url', null)
    } 
}
var deleteComment = exports.deleteComment = function(req,res){
    var nO = req;
    if (/^(http:\/\/)([\w]+\.){1,}[A-Z]{2,}\b/gi.test(nO.url)) {
          var threadId = convertURL(nO.url).slug || 'home',
          parent = convertURL(nO.url).host;
          thread = threadKey(threadId,parent),
          comment = nO.data;
      redis.multi()
           .HDEL(thread, comment.id)
           .HDEL('u:'+ comment.authorId, comment.lid)
           .exec(function(e,d2){
             if (e) {
               res('No ok: ' + e, null)
             } else {
               res(null, 'ok')
             }
           });
    } else {
      res('I need an url', null)
    }
}

var fetchByThread = module.exports.fetchByThread  = function(req,res){
  var nO = req,
      threadId = convertURL(nO.url).slug || 'home',
      parent = convertURL(nO.url).host,
      thread = threadKey(threadId,parent);
    redis.hgetall(thread, function(e,d){
      if (e){
        res(e,null);
      } else {
        res(null,d);
      }
    });
}
var fetchByUser = module.exports.fetchByUser = function(req, res) {
    redis.hgetall('u:' + req.data.authorId, function(e,d){
      if (!e) {
        res(null, d);
      } else {
        res(e,null);
      }
    });
}
var fetchBySite = module.exports.fetchBySite = function(site,res){
  redis.lrange(shortTKeys(convertURL(site).host), 0, -1, function(e,d){
    if (e) {
      res(e, null);
    } else {  
      var d = d.unique();
      var r = [];
      var i = 0;
      d.forEach(function(u){
        var threadId = slOff(u),
          parent = site,
          thread = threadKey(threadId,parent);
          redis.hgetall(thread, function(e,dd){
            i++;
            r.push({"path": u, "comments": dd});
            if (i === d.length) {
             res(null, JSON.stringify(r));
            }
          });
      });
    }
  });
}

/*
* TODO: Optional
* Implement edit comments via merge
*/
var merge = module.exports.merge = function (obj1, obj2) {
  for (var p in obj2) {
    try {
      if ( obj2[p].constructor===Object ) {
        obj1[p] = merge(obj2[p], obj1[p]);
      } else {
        if (typeof parseFloat(p) != 'number') /* WTF¡ lol */{ 
          obj1[p] = obj2[p];  
        }
      }
    } catch(e) {     
      obj1[p] = obj2[p];
    }
  }
  return obj1;
}
var edit = module.exports.edit = function(obj, res){
    var nO = obj,
      threadId = convertURL(nO.url).slug || 'home',
      parent = convertURL(nO.url).host,
      thread = threadKey(threadId,parent);
      redis.hget(thread, nO.data.id, function(e,d){
        if (d) {
          d = JSON.parse(d);
          d.comment =  nO.data.comment;
          d.time = Date.now();
          redis.hset(thread, nO.data.id, JSON.stringify(d), function(e,d){
            if (d===0) d ='ok';
            res(e,d);
          });
        }
      });
}

/*
var test = {url:'http://numbus.co:8080/f/pruebas/h/hsas', comment: { authorId: "4ebef2c27f21bd298a000000", comment: "He SIDO EDITADO 2 veces",time: Date.now(), parent: "URL parent or comment parent as reply sistema",id:2,lid:1 } };
edit(test, function(e,d){
  console.log(d);
});
*/
/* Pruebas */
/*
* All the methods are asyncronous...
* for example for a new comment just do:

  var test = { url:'http://numbus.co:8080/f/pruebas/h', comment: { authorId: "4ebef2c27f21bd298a000000", comment: "YOUR PROBANDO",time: Date.now(), parent: "URL parent or comment parent as reply sistema" } };

  newComment(test, function(e,d){
    console.log(d);
  });

 * for delete a comment do:
 var dtest ={url:'http://numbus.co:8080/f/pruebas/h',comment:{authorId: "4ebef2c27f21bd298a000000",lid:1,id:1}}
 deleteComment(dtest, function(e,d){
   console.log(d);
 });
*/
/*
for (var i=0;i<1; i++)  {
  comment= { authorId: "4ebef2c27f21bd298a000000", comment: "YOUR PROBANDO" +i,time: Date.now(), parent: "URL parent or comment parent as reply sistema" } ;
  newComment({ url:'http://numbus.co/f/pruebas/h/hsas', comment:comment}, function(e,d){
  });  
}
*/
