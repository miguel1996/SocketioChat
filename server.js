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
const connections = [];
io.sockets.on('connection',(socket) => {
   connections.push(socket);
   users.push(socket.id);
   console.log(' %s sockets is connected', connections.length);
   socket.emit('start',{message:socket.id});

   io.sockets.emit('all sockets',{message: users});

   socket.on('disconnect', () => {
      console.log("disconect "+socket.id);
      users.splice(users.indexOf(socket.id), 1);
      connections.splice(connections.indexOf(socket), 1);
   });

   socket.on('sending message', (message) => {
      console.log('Message is received :', message);
      io.sockets.emit('new message', {message: message,socket:socket.id});

   });

   socket.on('private',(data) =>{
      if(data.target=123)
      socket.emit('123',info);
      if(data.target=321)
      socket.emit('321',info);
   });
});

app.get('/', (req, res) => {
   res.render('index');
   // res.sendFile(__dirname + '/index.html');
});