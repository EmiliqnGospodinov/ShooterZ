var express = require('express');
var app = express();
app.use('/client', express.static(__dirname + '/client'));
var serv = require('http').Server(app);

// db
var mongojs = require('mongojs');
var db = mongojs('mongodb://decisioner:gs4k56al12@ds117199.mlab.com:17199/shooterzdb', ['account','progress']);

app.get('/', function(req, res){
  res.sendFile(__dirname+'/client/index.html');
});
serv.listen(process.env.PORT || 2000);
console.log("Server started.");
var SOCKET_LIST = {};

var Entity = function(){
  var self = {
    x:250,
    y:250,
    spdX:0,
    spdY:0,
    id:"",
  }
  self.update = function(){
      self.updatePosition();
  }
  self.updatePosition = function(){
    self.x += self.spdX;
    self.y += self.spdY;
  }
  self.getDistance = function(pt){
    return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
  }

  return self;
}

var Player = function(id){
  var self = Entity();
  self.id = id;
  self.number = "" + Math.floor(10 * Math.random());
  self.pressingRight = false;
  self.pressingLeft = false;
  self.pressingUp = false;
  self.pressingDown = false;
  self.pressingAttack = false;
  self.mouseAngle = 0;
  self.maxSpd = 10;

  var super_update = self.update;
  self.update = function(){
    self.updateSpd();
    super_update();
    if(self.pressingAttack){
      self.shootBullet(self.mouseAngle);
    }
  }


  self.updateSpd = function(){
    if(self.pressingRight && self.x < 470)
      self.spdX = self.maxSpd;
    else if(self.pressingLeft && self.x > 30)
      self.spdX = -self.maxSpd;
    else
      self.spdX = 0;

    if(self.pressingUp && self.y > 30)
      self.spdY = -self.maxSpd;
    else if(self.pressingDown && self.y < 470)
      self.spdY = self.maxSpd;
    else
      self.spdY = 0;
  }

  self.shootBullet = function(angle){
    var b = Bullet(self.id,angle);
    b.x = self.x;
    b.y = self.y;
  }

  Player.list[id] = self;
  return self;
}
Player.list = {};
Player.onConnect = function(socket){
  var player = Player(socket.id);
  socket.on('keyPress',function(data){
    if(data.inputId === 'left')
      player.pressingLeft = data.state;
    else if(data.inputId === 'right')
      player.pressingRight = data.state;
    else if(data.inputId === 'up')
      player.pressingUp = data.state;
    else if(data.inputId === 'down')
      player.pressingDown = data.state;
    else if(data.inputId === 'attack')
      player.pressingAttack = data.state;
    else if(data.inputId === 'mouseAngle')
      player.mouseAngle = data.state;
  });
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}
Player.update = function(){
  var pack = [];
  for(var i in Player.list){
    var player = Player.list[i];
    player.update();
    pack.push({
      x:player.x,
      y:player.y,
      number:player.number
    });
  }
  return pack;
}

var Bullet = function(parent, angle){
  var self = Entity();
  self.id = Math.random();
  self.spdX = Math.cos(angle/180*Math.PI) * 10;
  self.spdY = Math.sin(angle/180*Math.PI) * 10;
  self.parent = parent;
  self.timer = 0;
  self.toRemove = false;
  var super_update = self.update;
  self.update = function(){
    if(self.timer++ > 100)
      self.toRemove = true;
      super_update();
      for(var i in Player.list){
        var p = Player.list[i];
        if(self.getDistance(p) < 32 && self.parent !== p.id){
          //handle collision. ex: hp--;
          self.toRemove = true;
        }
      }
  }
  Bullet.list[self.id] = self;
  return self;
}
Bullet.list = {};

Bullet.update = function(){
  var pack = [];
  for(var i in Bullet.list){
    var bullet = Bullet.list[i];
    bullet.update();
    if(bullet.toRemove)
      delete Bullet.list[i];
    else
      pack.push({
        x:bullet.x,
        y:bullet.y,
      });
  }
  return pack;
}

var USERS = {
  //username:password
  "name":"pass",
  "asd":"asd"
}

var isValidPassword = function(data,cb){
    db.account.find({username:data.username,password:data.password},function(err,res){
        if(res.length > 0)
            cb(true);
        else
            cb(false);
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

  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;

  socket.on("signIn",function(data){
    isValidPassword(data,function(res){
      if(res){
        Player.onConnect(socket);
        socket.emit('signInResponse',{success:true});
      }else{
        socket.emit('signInResponse',{success:false});
      }
    });
  });

  socket.on("signUp",function(data){
    isUsernameTaken(data,function(res){
      if(res){
        socket.emit('signUpResponse',{success:false});
      }else{
        addUser(data, function(){
          socket.emit('signUpResponse',{success:true});
        });
      }
    });
  });

  socket.on('disconnect',function(){
    delete SOCKET_LIST[socket.id];
    Player.onDisconnect(socket);
  });
});

setInterval(function(){
  var pack = {
    player:Player.update(),
    bullet:Bullet.update(),
  }
  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
    socket.emit('newPositions',pack);
  }
},1000/25);
