import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import ejs from 'ejs';

const User = require("./model/User");
const Message = require("./model/Message");
var mongoConfigs = require("./model/mongoConfigs");
mongoConfigs.connect(() => {
   console.log("Connected to the mongo server");
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

   socket.on('join', function (data) {
      var user_name = data.user_name;
      var password = data.password;

      //rooms will also be used for the private messaging
      //https://socket.io/docs/rooms-and-namespaces/#default-room
      socket.join(user_name);//defining a room with the name of the socket and joining that socket to the room
      //checks if a user already exists and inserts in db if not
      autenticateUser(user_name, password, (authentication) => {
         if (authentication) {
            //related the socket.id to the user logedin
            connections[socket.id] = user_name;
            console.log(user_name + ' joined');

            //sends the last 10 public msgs to a user that just entered
            Message.getPublic((lastMessages) => {
               //emits a private event to tell the client the result of the authentication   
               io.to(user_name).emit('auth', { message: 'sucess', lastMessages });
            });

            //created a message for all to see that there are new users in the chat
            var message = { welcome: user_name + " has joined the chat room" };
            io.emit('update', { message, connections });
         }
         else {
            io.to(user_name).emit('auth', { message: 'fail' });
         }
      });
   });

   //when someone sends a message the server will store it and broadcast it to everyone
   socket.on('sending message', (message) => {
      var user = connections[socket.id];
      User.getId(user, (id) => {
         Message.insertMessage(message, id, user);//inserts a message in db with the id of the user that sent it
      });
      console.log(user + " : " + message);
      io.sockets.emit('new message', { message: message, socket: user });
   });

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


function autenticateUser(user_name, password, callback) {
   User.exists(user_name, (result) => {
      //se nao existe entao adiciona
      if (!result) {
         addUserIfNotExists(user_name, password);
         callback(true);//true means that the authentications ended sucessfully(this means that a user has logged on)
      }
      //se ja existe um user na bd entao verifica a pass
      else {
         User.auth(user_name, password, (result) => {
            //se autenticação foi bem sucedida
            if (result) {
               callback(true);
            } else {
               console.log('atenticação falhou: ' + user_name + " pw: " + password);
               callback(false);
            }
         });
      }
   });
}

function addUserIfNotExists(user_name, password) {
   User.exists(user_name, (result) => {
      if (!result) {
         User.insertUser(user_name, password);
         console.log('created ' + user_name);
      }
   });
}