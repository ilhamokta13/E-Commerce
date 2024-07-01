const User = require('../models/user-schema');

const sendMessage = (req, res) => {
    const { room, message } = req.body;

    // Logika untuk mengirim pesan chat
    // Contoh: Broadcast pesan ke semua user di room menggunakan socket.io
    req.app.get('io').to(room).emit('message', { user: 'Server', text: message });

    res.status(200).send({ message: 'Message sent successfully.' });
};

module.exports = {
    sendMessage,
};
