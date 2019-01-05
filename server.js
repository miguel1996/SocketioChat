import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import ejs from 'ejs';

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
app.set('view engine','ejs');

const PORT = 3000;
server.listen(PORT);
console.log('Server is running');

const users = [];
const connections = {};
io.sockets.on('connection',(socket) => {
   
   socket.on('join',function(user_name){
     connections[socket.id] = user_name;
     //users.push([socket.id,user_name]);
     console.log('join event user:'+user_name);
     var message ={welcome:user_name+" has joined the chat room"};
     io.emit('update',{message,connections});
 });

   // connections.push(socket);
   // users.push(socket.id);
   // console.log(' %s sockets is connected', connections.length);
   // socket.emit('start',{message:socket.id});

   // io.sockets.emit('all sockets',{message: users});

   

   socket.on('sending message', (message) => {
      var user = connections[socket.id];
      console.log(user+" : "+message);
      io.sockets.emit('new message', {message: message,socket:user});

   });

   // socket.on('private',(data) =>{
   //    if(data.target=123)
   //    socket.emit('123',info);
   //    if(data.target=321)
   //    socket.emit('321',info);
   // });
   socket.on('disconnect', () => {
      var user = connections[socket.id];
      if(user){
      console.log(user+"disconect "+socket.id);
      delete connections[socket.id];
      var message ={welcome:user+" has disconected from the chat room"};
      io.emit('update',{message,connections});
      }
   });
});

app.get('/', (req, res) => {
   res.render('index');
   // res.sendFile(__dirname + '/index.html');
});