import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import ejs from 'ejs';

const User = require("./model/User");
const Message = require("./model/Message");
var mongoConfigs = require("./model/mongoConfigs");
mongoConfigs.connect(() => {
   app.listen(8080, function () {
      console.log("listening on port 8080");
   });
});

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
app.set('view engine', 'ejs');

const PORT = 3000;
server.listen(PORT);
console.log('Server is running on port ' + PORT);

const connections = {};
io.sockets.on('connection', (socket) => {

   socket.on('join', function (user_name) {
      //checks if a user already exists and inserts in db if not
      addUserIfNotExists(user_name);
      // User.getAll((data)=>{console.log(data);});

      //related the socket.id to the user logedin
      connections[socket.id] = user_name;
      console.log(user_name+' joined');
      //created a message for all to see
      var message = { welcome: user_name + " has joined the chat room" };
      io.emit('update', { message, connections });
   });

   //when someone sends a message the server will store it and broadcast it to everyone
   socket.on('sending message', (message) => {
      var user = connections[socket.id];
      User.getId(user, (id) => {
         Message.insertMessage(message, id);//inserts a message in db with the id of the user that sent it
      });
      console.log(user + " : " + message);
      io.sockets.emit('new message', { message: message, socket: user });
   });

   // socket.on('private',(data) =>{
   //    if(data.target=123)
   //    socket.emit('123',info);
   //    if(data.target=321)
   //    socket.emit('321',info);
   // });

   socket.on('disconnect', () => {
      var user = connections[socket.id];
      if (user) {
         console.log(user + " disconected with socketid " + socket.id);
         delete connections[socket.id];
         var message = { welcome: user + " has disconected from the chat room" };
         io.emit('update', { message, connections });
      }
   });
});

app.get('/', (req, res) => {
   res.render('index');
});

function addUserIfNotExists(user_name) {
   User.exists(user_name, (result) => {
      if (!result) {
         User.insertUser(user_name, '123');
         console.log('created '+user_name);
      }
   }); 
}