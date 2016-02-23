var express = require('express');
var app = express();

var port = process.env.PORT || 3000;

app.use('/', express.static("./public"));

var server = app.listen(port);

var io = require('socket.io').listen(server);

var users = {};
var queue = [];
var current;
var start;
var sync;
var set = false;

io.on('connection', function (socket) {

  socket.on('setUser', function (username) {
    users[socket.id] = username;
  });

  socket.on('getQueue', function() {
    io.sockets.connected[socket.id].emit('sendQueue', queue);
  })

  socket.on('getCurrent', function() {
    if (current) {
      io.sockets.connected[socket.id].emit('sendCurrent', current.id);
    }
  })

  socket.on('getTime', function() {
    io.sockets.connected[socket.id].emit('sendTime', start);
  })

  socket.on('sendMessage', function (data) {
    io.emit('messageSent', data);
  })

  socket.on('enqueue', function (data) {
    if (current) {

      queue.push(data);

      io.emit('addVideo', data);
    } else {
      set = false;
      current = data;
      io.emit('firstVideo', data.id);
    }
  })

  socket.on('dequeue', function (data) {
    io.emit('removeVideo', data);
  })

  socket.on('updateQueue', function (data) {
    queue = data;
    socket.broadcast.emit('refreshQueue', queue);
  })
  socket.on('videoEnded', function () {
    set = false;
    current = queue.shift();
    io.emit('nextVideo', current);
    io.emit('refreshQueue', queue);
  })
  socket.on('setDuration', function (data) {
    if (!set) {
      set = true;
      start = data;
      clearInterval(sync);
      sync = setInterval(function() {
        console.log(start);
        start++;
      }, 1000);
    }
  });
});


