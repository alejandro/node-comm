var express = require('express'),
    crypto = require('crypto'),
    url = require('url'),
    sys = require('util'),
    util = require('./lib/utils').util,
    app = module.exports =  express.createServer( express.cookieParser(),express.session({ secret: 'keyboard cat' })),
    nowjs = require('now'),
    groups =[],
    escape = require('./lib/autolink'),
    ID=require('./lib/ObjectID').ObjectId; // for testing purpose

var comments = require('./lib/comments'),
    Comment = require('./lib/comments').Comment;
/* A little hack for correct handle of session */
  
app.configure(function(){
  app.set('views',__dirname+ '/views');
  app.set('view engine','jade');
  app.use(app.router);
  app.use(express.static(__dirname+'/public'));
  app.use(express.methodOverride());
  app.use(express.bodyParser());
});
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});
app.dynamicHelpers({
  message: function(req){
    var err = req.session.error
      , msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    if (err) return '<p class="msg error">' + err + '</p>';
    if (msg) return '<p class="msg success">' + msg + '</p>';
  }
});

app.get('/', function(req, res){
  var n = new ID().toString()
  res.render("form",{user: { id: n},title:"HOME"})
});

app.get('/otraURL',function(req,res){
  console.log(req.url);
  var n = new ID().toString();
  res.render("form",{user: { id: n},title:"otraURL"})
});
app.get('/login', function(req, res){
  res.render('login',{title:'Hol'});
});

app.post('/login', function(req, res){
});
// Regresa el index num de un valor en una array como el de un 
// objeto objeto["VALOR"] -> array[indexOf(array,VALOR)]
function indexOf(array, value){
  var i = 0, f=-1;
  array.forEach(function(v) {
    if (v.member.groupName === value) {
      f = i;
    } else if (array.length=== i){
      return false;
    } else {
      i++;
    }
  });    
  return f;
}
// Una array es miembro 
function isMember(array,path){
  var i = 0,f=-1;
  array.forEach(function(v){
    if (v.member.groupName === path) {
      f = 0;
    } else {
      i++
    }
  });
  return f;
}
app.listen(process.env.PORT || 8080);
console.log('Server on port: %s \non: %s ',app.address().port,app.settings.env);

var everyone = nowjs.initialize(app);
everyone.now.joinRoom = function(req){
     nowjs.getGroup(req.url).addUser(this.user.clientId);
}
everyone.now.sendComment = function(req) {
    var self = this;
    req = new Comment(req);
    req.save(function(e,d){
      if (d) {
        nowjs.getGroup(req.url).now.receiveMessage(req.data.authorId,escape.autoLink(util.toStaticHTML(req.data.comment)));
      } else {
        nowjs.getClient(self.user.clientId, function(){        
          this.now.receiveMessage('SERVER:', req.validateC());
        });
      }
    });
}
everyone.now.fetchBySite = function(req,res){
  comments.fetchBySite(req.url,function(e,r){
    res(e,r);
  });
}
everyone.now.fetchByThread = function(req,res){
  comments.fetchByThread(req,function(e,r){
    res(e,r);
  });
}
everyone.now.send = function(req){   
  if (req.data) {
    nowjs.getGroup(req.url).now.receiveMessage(req.data.id, req.data.msg)   
  } 
}
everyone.now.delete = function(req){
  comments.deleteComment(req,function(e,d){
    nowjs.getGroup(req.url).now.onEditMessage(req.data.authorId,util.toStaticHTML(req.data.comment));
  });
}
everyone.now.edit = function(req){
  comments.edit(req,function(e,d){
    nowjs.getGroup(req.url).now.onEditMessage(req.data.authorId,util.toStaticHTML(req.data.comment));
  });
}
everyone.now.autoLink = function(req, res){
 res(escape.autoLink(req));
}
