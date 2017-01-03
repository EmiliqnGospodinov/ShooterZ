var ctx = document.getElementById("ctx").getContext("2d");
ctx.font = '15px Arial';
var cradius = 30;
var socket = io();
var playerx,playery;

socket.on('newPositions',function(data){
  ctx.clearRect(0,0,document.getElementById("ctx").width,document.getElementById("ctx").height);
  for(var i = 0 ; i < data.player.length; i++){
    ctx.fillText(data.player[i].number,data.player[i].x-4,data.player[i].y+5);//center the name
    ctx.beginPath();
    ctx.arc(data.player[i].x,data.player[i].y,cradius,0,2*Math.PI);//x,y, radius, cut
    ctx.stroke();
    playerx = data.player[i].x;
    playery = data.player[i].y;
  }
  for(var i = 0 ; i < data.bullet.length; i++)
    ctx.fillRect(data.bullet[i].x-5,data.bullet[i].y-5,5,5);//center the bullet
});

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
