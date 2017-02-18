const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read the index into memory
const index = fs.readFileSync(`${__dirname}/../client/index.html`);


const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`listening on 127.0.0.1: ${port}`);

const io = socketio(app);

const draws = {};
const users = {};
const freeIds = [];

const syncCanvas = (socket) => {
  socket.emit('syncCanvas', { draws });
};

const getNextID = () => {
  if (freeIds.length !== 0) {
    return freeIds.pop();
  }
  return Object.keys(users).length;
};

const onJoin = (sock) => {
  const socket = sock;

  socket.uid = getNextID();
  users[socket.uid] = undefined;// undefined cuz unused//socket;
  socket.join('room1');

  socket.emit('setId', { id: socket.uid });
  syncCanvas(socket);
};

const onDraw = (sock) => {
  const socket = sock;
  socket.on('draw', (data) => {
    const time = new Date().getTime();

    const drawObj = {
      when: time,
      shape: data.shape,
    };

    drawObj.shape.owner = socket.uid;

    draws[socket.uid] = drawObj;

    syncCanvas(io.to('room1'));
  });
};
const onDisconnect = (socket) => {
  socket.on('disconnect', () => {
    delete users[socket.uid];
    delete draws[socket.uid];
    freeIds.push(socket.uid);

    syncCanvas(io.to('room1'));
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');
  onJoin(socket);
  onDraw(socket);
  onDisconnect(socket);
      /*
    onJoined(socket);
    onMsg(socket);
    socket.on('disconnect', () => {
      onDisconnect(socket);
    });
    */
});
