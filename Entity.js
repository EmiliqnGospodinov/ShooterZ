var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};

Entity = function(){
  var self = {
    x:Math.random() * (870 - 60) + 60,
    y:Math.random() * (720 - 60) + 60,
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
Entity.getFrameUpdateData = function(){
	var pack = {
		initPack:{
			player:initPack.player,
			bullet:initPack.bullet,
		},
		removePack:{
			player:removePack.player,
			bullet:removePack.bullet,
		},
		updatePack:{
			player:Player.update(),
			bullet:Bullet.update(),
		}
	};
	initPack.player = [];
	initPack.bullet = [];
	removePack.player = [];
	removePack.bullet = [];
	return pack;
}

Player = function(id, username, param){
  var self = Entity();
  self.id = id;
  self.username = username;
  self.pressingRight = false;
  self.pressingLeft = false;
  self.pressingUp = false;
  self.pressingDown = false;
  self.pressingAttack = false;
  self.mouseAngle = 0;
  self.maxSpd = 7;
  self.hp = 3;
  self.hpMax = 3;
  self.score = 0;
  self.shootDelay = 10;

  var super_update = self.update;
  self.update = function(){
    self.shootDelay++;
    self.updateSpd();
    super_update();
    if(self.pressingAttack){
      if(self.shootDelay >= 10){
        self.shootBullet(self.mouseAngle);
        self.shootDelay = 0;
      }
    }
  }
  self.shootBullet = function(angle){
    var b = Bullet(self.id,angle);
    b.x = self.x;
    b.y = self.y;
  }

  self.updateSpd = function(){
    if(self.pressingRight && self.x < 870)// ???? number, radius bug??
      self.spdX = self.maxSpd;
    else if(self.pressingLeft && self.x > 60)// ???? number, radius bug??
      self.spdX = -self.maxSpd;
    else
      self.spdX = 0;
    if(self.pressingUp && self.y > 60)// ???? number, radius bug??
      self.spdY = -self.maxSpd;
    else if(self.pressingDown && self.y < 720)// ???? number, radius bug??
      self.spdY = self.maxSpd;
    else
      self.spdY = 0;
  }

  self.getInitPack = function(){
    return{
      id:self.id,
      x:self.x,
      y:self.y,
      username:self.username,
      hp:self.hp,
      hpMax:self.hpMax,
      score:self.score,
    };
  }
  self.getUpdatePack = function(){
    return{
      id:self.id,
      x:self.x,
      y:self.y,
      hp:self.hp,
      score:self.score,
    };
  }

  Player.list[id] = self;
  initPack.player.push(self.getInitPack());
  return self;
}
Player.list = {};
Player.onConnect = function(socket, username){
  var player = Player(socket.id, username, socket);
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
  socket.emit('init',{
    player:Player.getAllInitPack(),
    bullet:Bullet.getAllInitPack(),
  })
}
Player.getAllInitPack = function(){
  var players = [];
  for(var i in Player.list){
    players.push(Player.list[i].getInitPack());
  }
  return players;
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}
Player.update = function(){
  var pack = [];
  for(var i in Player.list){
    var player = Player.list[i];
    player.update();
    pack.push(player.getUpdatePack());
  }
  return pack;
}

Bullet = function(parent, angle){
  var self = Entity();
  self.id = Math.random();
  self.spdX = Math.cos(angle/180*Math.PI) * 20;
  self.spdY = Math.sin(angle/180*Math.PI) * 20;
  self.parent = parent;
  self.timer = 0;
  self.toRemove = false;
  var super_update = self.update;
  self.update = function(){
    if(self.timer++ > 40)
      self.toRemove = true;

      super_update();
      for(var i in Player.list){
        var p = Player.list[i];
        if(self.getDistance(p) < 32 && self.parent !== p.id){
          p.hp -= 1;
          if(p.hp <= 0) {
            var shooter = Player.list[self.parent];
            if(shooter)
              shooter.score += 1;
            p.hp = p.hpMax;
            p.x = Math.random() * (870 - 60) + 60;
            p.y = Math.random() * (720 - 60) + 60;
          }
          self.toRemove = true;
        }
      }
  }
  self.getInitPack = function(){
    return{
      id:self.id,
      x:self.x,
      y:self.y,
    };
  }
  self.getUpdatePack = function(){
    return{
      id:self.id,
      x:self.x,
      y:self.y,
    };
  }
  Bullet.list[self.id] = self;
  initPack.bullet.push(self.getInitPack());
  return self;
}
Bullet.list = {};

Bullet.update = function(){
  var pack = [];
  for(var i in Bullet.list){
    var bullet = Bullet.list[i];
    bullet.update();
    if(bullet.toRemove){
      delete Bullet.list[i];
      removePack.bullet.push(bullet.id);
    }else{
      pack.push(bullet.getUpdatePack());
    }
  }
  return pack;
}
Bullet.getAllInitPack = function(){
  var bullets = [];
  for(var i in Bullet.list){
    bullets.push(Bullet.list[i].getInitPack());
  }
  return bullets;
}
