//Username and password examples:
//Username: asd ; Password: 123
//Username: 123 ; Password: 123
//Username: 1234 ; Password: 1234

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.set('view engine', 'ejs');
var sessions = require('client-sessions');
app.use('/client', express.static(__dirname + '/client'));
var serv = require('http').Server(app);
app.use(sessions({cookieName:'session',
                 secret:'secsession',
                 duration:24*60*60*1000,
                 activeDuration:5*60*1000
                })
);

// db
var mongojs = require('mongojs');
var db = mongojs('mongodb://decisioner:emo123456@ds117199.mlab.com:17199/shooterzdb', ['account','progress']);


var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.post('/game', urlencodedParser, function (req, res) {
  findUser(req.body, function(){
    req.session.username = req.body.username;
    res.render('index', {username: req.session.username});
  }, function(){
    res.redirect('/');
  });
});



app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/login.html');
});
app.get('/game', function(req, res){
  if(req.session.username === ''){
    res.setHeader('Username', req.session.username);
    res.redirect('/');
  }else{
    res.sendFile(__dirname + '/client/index.html');
  }
});
serv.listen(process.env.PORT || 2000);
console.log("Server started.");
var SOCKET_LIST = {};


//Login checks
var findUser = function(data, cb, loginError){
    db.account.find({username:data.username,password:data.password},function(err,res){
        if(res.length > 0)
            cb();
        else
            loginError();
    });
}
var isUsernameTaken = function(data,cb){
    db.account.find({username:data.username},function(err,res){
        if(res.length > 0)
            cb(true);
        else
            cb(false);
    });
}
var addUser = function(data,cb){
    db.account.insert({username:data.username,password:data.password},function(err){
        cb();
    });
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
  socket.on('signIn',function(data){
    Player.onConnect(socket, data.username);
  });
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;

  socket.on('disconnect',function(){
    delete SOCKET_LIST[socket.id];
    Player.onDisconnect(socket);
  });
});

require('./Entity');

setInterval(function(){
  var packs = Entity.getFrameUpdateData();
  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
    socket.emit('init',packs.initPack);
    socket.emit('update',packs.updatePack);
    socket.emit('remove',packs.removePack);
    socket.emit('player_id', socket.id);
  }
},1000/40);
