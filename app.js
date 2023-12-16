// app.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const createError = require('http-errors');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const { NodeVM } = require('vm2');
const db = require('./db');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Configuration de la vue
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(session({
  secret: 'sssshhhhh',
  resave: true,
  saveUninitialized: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Middleware pour gérer les erreurs 404
app.use((req, res, next) => {
  next(createError(404));
});

// Middleware pour gérer les erreurs
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Endpoint pour exécuter du code en toute sécurité
app.post('/runjs', (req, res) => {
  const code = req.body.code;

  try {
    const result = executeSafely(code);
    res.send({ result });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Fonction pour exécuter du code en toute sécurité
function executeSafely(code) {
  const vm = new NodeVM();
  return vm.run(code);
}

// Socket.IO pour la gestion des messages
app.get('/get-messages-socketio', (req, res) => {
  const user = req.session.user;
  const { sender_id, receiver_id } = req.query;

  if (!sender_id || !receiver_id) {
    return res.status(400).send('Sender ID and Receiver ID are required');
  }

  const getMessagesQuery = 'SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp';

  db.query(getMessagesQuery, [sender_id, receiver_id, receiver_id, sender_id], (err, results) => {
    if (err) {
      console.error('Error retrieving messages:', err);
      res.status(500).send('Server error');
    } else {
      io.to(receiver_id).emit('newMessages', results);
      res.status(200).send('Messages sent successfully');
    }
  });
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Gérer la connexion du client à une salle spécifique
  socket.on('joinRoom', (room) => {
    socket.join(room);
  });

  // Gérer la déconnexion du client
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Connexion à la base de données
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connecté à la base de données MySQL');
  }
});

// Lancement du serveur
server.listen(3001, () => {
  console.log('Listening on port 3001');
});

module.exports = app;
