require('dotenv').config();
require('./cron/archiveChats.js');

const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const groupRoutes = require('./routes/groupRoutes');
const directRoutes = require('./routes/directRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); 

const db = require('./models');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const connectedUsers = new Map();

app.set('io', io);

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => res.redirect('/signup'));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'views/signup.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views/login.html')));
app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'views/chat.html')));
app.get('/group', (req, res) => res.sendFile(path.join(__dirname, 'views/group.html')));

app.use('/', authRoutes);
app.use('/', chatRoutes);
app.use('/', groupRoutes);
app.use('/', directRoutes);
app.use('/', uploadRoutes); 

io.on('connection', (socket) => {
  console.log(' A user connected');

  socket.on('register', (userId) => {
    connectedUsers.set(Number(userId), socket.id);
    socket.join(userId.toString());
    console.log(` Registered user ${userId} in map`);
  });

  socket.on('chat message', (data) => {
    const { user_id, group_id, content, user } = data;
    if (!group_id) return;

    db.query(
      'SELECT * FROM group_members WHERE user_id = ? AND group_id = ?',
      [user_id, group_id],
      (err, result) => {
        if (err) return console.error(err);
        if (result.length === 0) return;

        db.query(
          'INSERT INTO messages (user_id, group_id, content) VALUES (?, ?, ?)',
          [user_id, group_id, content],
          (err, insertResult) => {
            if (err) return console.error(err);

            io.emit('chat message', {
              id: insertResult.insertId,
              group_id,
              user,
              content
            });
          }
        );
      }
    );
  });

  socket.on('direct message', (data) => {
    const { from, to, content } = data;

    db.query(
      'SELECT name, phone FROM users WHERE id = ?',
      [from],
      (err, rows) => {
        if (err || rows.length === 0) {
          console.error('Could not get sender details');
          return;
        }

        const senderName = rows[0].name;
        const senderPhone = rows[0].phone;

        db.query(
          'INSERT INTO direct_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
          [from, to, content],
          (err2, result) => {
            if (err2) {
              console.error('DM save error:', err2);
              return;
            }

            const newMsg = {
              id: result.insertId,
              from,
              to,
              content,
              sender: senderName,
              phone: senderPhone
            };

            db.query(
              'INSERT IGNORE INTO contacts (user_id, contact_id) VALUES (?, ?)',
              [to, from],
              () => {}
            );

            const receiverSocketId = connectedUsers.get(Number(to));
            if (receiverSocketId) {
              io.to(receiverSocketId).emit('direct message', newMsg);
            }

            socket.emit('direct message', newMsg);
          }
        );
      }
    );
  });

  socket.on('disconnect', () => {
    for (let [uid, sid] of connectedUsers) {
      if (sid === socket.id) {
        connectedUsers.delete(uid);
        break;
      }
    }
    console.log('A user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
