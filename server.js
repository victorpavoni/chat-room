const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./assets/messages');
const { userJoin, getCurrentUser, getRoomUsers, userLeave } = require('./assets/users');

const app = express();
const http = require('http').createServer(app);
const io = socketio(http);
const botName = 'ChatCord Bot';

io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    socket.emit('message', formatMessage(botName, 'Welcome to chatCord'));
    socket.broadcast
    .to(user.room)
    .emit(
      'message',
      formatMessage(botName, `${user.username} has joined the chat`)
    );

    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  })
  
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io
    .to(user.room)
    .emit('message', formatMessage(user.username, msg));
  });
  
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);;

    if(user) {
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user)
      });
      
      io.to(user.room).emit('userRoomDisconnect', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
    
  });
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'client')));

http.listen(PORT, () => console.log(`http://localhost:${PORT}`));