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
      //socket.join(user_name);//defining a room with the name of the socket and joining that socket to the room
      //checks if a user already exists and inserts in db if not
      autenticateUser(user_name, password, (authentication) => {
         if (authentication) {
            //related the socket.id to the user logedin
            connections[socket.id] = user_name;
            console.log(user_name + ' joined');

            //sends the last 10 public msgs to a user that just entered
            Message.getPublic((lastMessages) => {
               //emits a private event to tell the client the result of the authentication   
              // io.to(user_name).emit('auth', { message: 'sucess', lastMessages,user_name });
               io.sockets.connected[socket.id].emit('auth', { message: 'sucess', lastMessages,user_name });
            });

            //created a message for all to see that there are new users in the chat
            var message = { welcome: user_name + " has joined the chat room" };
            io.emit('update', { message, connections});
         }
         else {
            io.sockets.connected[socket.id].emit('auth', { message: 'fail' });
            //io.to(user_name).emit('auth', { message: 'fail' });
         }
      });
   });

   socket.on('requesting last messages',(data)=>{
      let user_name =  connections[socket.id];
      if(data.target === 'general')
      { 
         Message.getPublic((lastMessages) => {
            //emits a private event to tell the client the result of the authentication   
            //io.to(user_name).emit('last public messages', { message: 'sucess', lastMessages });
            io.sockets.connected[socket.id].emit('last public messages', { message: 'sucess', lastMessages });
         });
      }else{
         //sends the last messages between the requester and his target
         Message.getPrivate(data.target,user_name,(lastMessages)=>{
            //io.to(user_name).emit('last public messages', { message: 'sucess', lastMessages });
            io.sockets.connected[socket.id].emit('last public messages', { message: 'sucess', lastMessages });
         })
      }
      
   });

   //when someone sends a message the server will store it and broadcast it to everyone
   socket.on('sending message', (data) => {
      var user = connections[socket.id];
      addMessageToDatabase(user,data);//adds the message to the correct place in db(to a private or public collection)
      emitMessage(user,data,io);
     
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

function addMessageToDatabase(user_name,data){
   if(data.target === "general"){
   User.getId(user_name, (id) => {
      Message.insertMessage(data.message, id, user_name);//inserts a message in db with the id of the user that sent it
   });
   }
   else{
      User.getId(user_name, (id) => {
         Message.insertPrivateMessage(data.message, id, user_name, data.target);//inserts a message in db with the id of the user that sent it
      });
   }
}
function emitMessage(user,data,io){
   if(data.target === 'general')
   {
      console.log('GENERAL-'+user + " : " + data.message);
      io.sockets.emit('new message', { message: data.message, socket: user });
   }
   else{
      console.log('PRIVATE-'+user+': '+data.message+" TO "+data.target);
      let sender_socket_id = Object.keys(connections).find(key=>connections[key] === user);
      io.sockets.connected[sender_socket_id].emit('private',{message:data.message,target:data.target,sender:user});
      let target_socket_id = Object.keys(connections).find(key=>connections[key] === data.target);
      io.sockets.connected[target_socket_id].emit('private',{message:data.message,target:data.target,sender:user});
   }
  
}