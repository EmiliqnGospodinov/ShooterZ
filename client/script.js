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
ctx.font = '15px Arial';
var cradius = 30;
var playerx,playery;

//init
var Player = function(initPack){
  var self = {};
  self.id = initPack.id;
  self.number = initPack.number;
  self.x = initPack.x;
  self.y = initPack.y;
  Player.list[self.id] = self;
  return self;
}
Player.list = {};

var Bullet = function(initPack){
  var self = {};
  self.id = initPack.id;
  self.x = initPack.x;
  self.y = initPack.y;
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
  ctx.clearRect(0,0,500,500);
  for(var i in Player.list)
    ctx.fillText(Player.list[i].number,Player.list[i].x-5,Player.list[i].y+5);//center the name
    ctx.beginPath();
    ctx.arc(Player.list[i].x,Player.list[i].y,cradius,0,2*Math.PI);//x,y, radius, cut
    ctx.stroke();
    playerx = Player.list[i].x;
    playery = Player.list[i].y;
  for(var i in Bullet.list)
      ctx.fillRect(Bullet.list[i].x-5,Bullet.list[i].y-5,5,5);//center the bullet
},40);

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
