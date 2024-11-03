
const { Server } = require('socket.io');
const io = new Server({
    //cors: "http://localhost:5173/"
    cors: "http://192.168.1.174:5173/"
})
io.on('connection', function (socket) {

    socket.on('canvasImage', (data) => {
        socket.broadcast.emit('canvasImage', data);
    });
});

io.listen(5000);

// const express = require('express');
// const app = express();

// app.get('/', (req, res) => res.send('Hello World!'));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
