var socket = io();
//divs
var signUpDiv = document.getElementById('signUpDiv');
var signInDiv = document.getElementById('signInDiv');
//sign in elements
var signInDivUsername = document.getElementById('signInDiv-username');
var signInDivPassword = document.getElementById('signInDiv-password');
var signInDivSignIn = document.getElementById('signInDiv-signIn');
var signInDivSignUp = document.getElementById('signInDiv-signUp');

//sign up elements
var signUpDivUsername = document.getElementById('signUpDiv-username');
var signUpDivPassword = document.getElementById('signUpDiv-password');
var signUpDivSignUp = document.getElementById('signUp');

//sing in functions
signInDivSignIn.onclick = function(){
  socket.emit('signIn',{username:signInDivUsername.value,password:signInDivPassword.value});
}
signInDivSignUp.onclick = function(){
  signInDiv.style.display = 'none';
  signUpDiv.style.display = 'block';
}
signUpDivSignUp.onclick = function(){
  signInDiv.style.display = 'none';
  signUpDiv.style.display = 'block';
}
socket.on('signInResponse',function(data){
    if(data.success){
        signInDiv.style.display = 'none';
        gameDiv.style.display = 'block';
    } else
        alert("Sign in unsuccessful.");
});

//sing in functions
signUpDivSignUp.onclick = function(){
  socket.emit('signUp',{username:signUpDivUsername.value,password:signUpDivPassword.value});
}
socket.on('signUpResponse',function(data){
    if(data.success){
        signUpDiv.style.display = 'none';
        signInDiv.style.display = 'block';
        alert("Sign up successful, please log in");
    } else
        alert("Sign up unsuccessful.");
});


//game
var ctx = document.getElementById("ctx").getContext("2d");
ctx.font = '10px Arial';
var cradius = 30;
var playerx, playery;

//init
var Player = function(initPack){
  var self = {};
  self.id = initPack.id;
  self.username = initPack.username;
  self.x = initPack.x;
  self.y = initPack.y;
  self.hp = initPack.hp;
  self.hpMax = initPack.hpMax;
  self.score = initPack.score;

  self.draw = function(){
    var hpWidth = 30* self.hp/ self.hpMax;
    ctx.fillText("Score: " + self.score,self.x - cradius,self.y - 43);// score
    ctx.fillText("HP ",self.x - cradius,self.y - 35);// HP
    ctx.fillRect(self.x - hpWidth/2,self.y - 40, hpWidth, 4);// HP
    ctx.fillText(self.username,self.x-cradius + 1,self.y+4);// name
    ctx.beginPath();
    ctx.arc(self.x,self.y,cradius,0,2*Math.PI);// circle(x,y, radius, cut(whole circle))
    ctx.stroke();
    playerx = self.x;
    playery = self.y;
  }

  Player.list[self.id] = self;
  return self;
}
Player.list = {};

var Bullet = function(initPack){
  var self = {};
  self.id = initPack.id;
  self.x = initPack.x;
  self.y = initPack.y;
  self.draw = function(){
    ctx.fillRect(self.x-5,self.y-5,5,5);//center the bullet
  }

  Bullet.list[self.id] = self;
  return self;
}
Bullet.list = {};

socket.on('init',function(data){
  //{ player : [{id:123,number:'1',x:0,y:0},{id:1,number:'2',x:0,y:0}], bullet: []}
  for(var i = 0 ; i < data.player.length; i++){
    new Player(data.player[i]);
  }
  for(var i = 0 ; i < data.bullet.length; i++){
    new Bullet(data.bullet[i]);
  }
});

socket.on('update',function(data){
  //{ player : [{id:123,x:0,y:0},{id:1,x:0,y:0}], bullet: []}
  for(var i = 0 ; i < data.player.length; i++){
    var pack = data.player[i];
    var p = Player.list[pack.id];
    if(p){
      if(pack.x !== undefined)
        p.x = pack.x;
      if(pack.y !== undefined)
        p.y = pack.y;
      if(pack.hp !== undefined)
        p.hp = pack.hp;
      if(pack.score !== undefined)
        p.score = pack.score;
    }
  }
  for(var i = 0 ; i < data.bullet.length; i++){
    var pack = data.bullet[i];
    var b = Bullet.list[data.bullet[i].id];
    if(b){
      if(pack.x !== undefined)
        b.x = pack.x;
      if(pack.y !== undefined)
        b.y = pack.y;
    }
  }
});

socket.on('remove',function(data){
  for(var i = 0; i < data.player.length; i++){
    delete Player.list[data.player[i]];
  }
  for(var i = 0; i < data.bullet.length; i++){
    delete Bullet.list[data.bullet[i]];
  }
})

setInterval(function(){
  ctx.clearRect(0,0,document.getElementById("ctx").width,document.getElementById("ctx").height);
  for(var i in Player.list)
    Player.list[i].draw();
  for(var i in Bullet.list)
    Bullet.list[i].draw();
},25);

document.onkeydown = function(event){
  if(event.keyCode === 68)    //d
    socket.emit('keyPress',{inputId:'right',state:true});
  else if(event.keyCode === 83)   //s
    socket.emit('keyPress',{inputId:'down',state:true});
  else if(event.keyCode === 65) //a
    socket.emit('keyPress',{inputId:'left',state:true});
  else if(event.keyCode === 87) // w
    socket.emit('keyPress',{inputId:'up',state:true});
}
document.onkeyup = function(event){
  if(event.keyCode === 68)    //d
    socket.emit('keyPress',{inputId:'right',state:false});
  else if(event.keyCode === 83)   //s
    socket.emit('keyPress',{inputId:'down',state:false});
  else if(event.keyCode === 65) //a
    socket.emit('keyPress',{inputId:'left',state:false});
  else if(event.keyCode === 87) // w
    socket.emit('keyPress',{inputId:'up',state:false});
}
document.onmousedown = function(event){
  socket.emit('keyPress',{inputId:'attack',state:true});
}
document.onmouseup = function(event){
  socket.emit('keyPress',{inputId:'attack',state:false});
}
document.onmousemove = function(event){
  var x = -playerx + event.clientX - 8;
  var y = -playery + event.clientY - 8;
  var angle = Math.atan2(y,x) / Math.PI * 180;
  socket.emit('keyPress',{inputId:'mouseAngle',state:angle});
}
