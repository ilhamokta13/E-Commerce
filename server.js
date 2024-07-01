const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

// Integrasi Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


io.on('connection', client => {
    console.log(`connection recieved`);
    client.on('new_message', (chat) => {
        console.log(`new message recieved: ${chat}`)
        io.emit('broadcast', chat)
    })
})

app.get('/', (req, res) => {
    res.send('Server is running')
});

// Routes
const chatRoutes = require('./routes/chat-route');
app.use('/chat', chatRoutes);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
