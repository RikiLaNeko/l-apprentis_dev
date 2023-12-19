const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const user = req.session.user;
  const customTitle = 'L\'apprenti codeur';
  res.render('index', { title: customTitle, user });
});

router.get('/chat/:id_sender', (req, res) => {
  const id_sender = req.params.id_sender;
  if (!id_sender) {
    return res.status(400).send('Sender ID is required');
  }
  res.redirect(`/chat?sender_id=${id_sender}`);
});

router.get('/chat', (req, res) => {
  const user = req.session.user;
  const receiver_id = req.query.receiver_id || null;

  const getUsersQuery = 'SELECT * FROM users WHERE username NOT IN ("root", "admin")';
  db.query(getUsersQuery, (err, users) => {
    if (err) {
      console.error('Error retrieving users:', err);
      return res.status(500).send('Server error');
    }

    const getMessagesQuery = 'SELECT * FROM messages WHERE sender_id = ? OR receiver_id = ? ORDER BY timestamp';
    db.query(getMessagesQuery, [user.id, user.id], (err, messages) => {
      if (err) {
        console.error('Error retrieving messages:', err);
        return res.status(500).send('Server error');
      }

      res.render('chat', { title: 'Chat', user, messages, users, receiver_id });
    });
  });
});

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username.length < 3 || username.length > 32 || password.length < 3 || password.length > 32) {
    return res.send('Username and password must have between 3 and 32 characters.');
  }

  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error('Error checking login:', err);
      res.status(500).send('Server error');
    } else {
      if (results.length > 0) {
        req.session.user = { id: results[0].id, username: results[0].username };
        res.redirect('/');
      } else {
        res.send('Incorrect credentials');
      }
    }
  });
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (username.length < 3 || username.length > 32 || password.length < 3 || password.length > 32) {
    return res.send('Username and password must have between 3 and 32 characters.');
  }

  const checkUsernameQuery = 'SELECT * FROM users WHERE username = ?';
  db.query(checkUsernameQuery, [username], (err, results) => {
    if (err) {
      console.error('Error checking username:', err);
      return res.status(500).send('Server error');
    }

    if (results.length > 0) {
      return res.send('Username already taken.');
    }

    const insertUserQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(insertUserQuery, [username, password], (err, results) => {
      if (err) {
        console.error('Error registering:', err);
        return res.status(500).send('Server error');
      }

      req.session.user = { id: results.insertId, username };
      res.send('Registration successful');
    });
  });
});

router.post('/logout', (req, res) => {
  req.session.user = null;

  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      res.status(500).send('Server error');
    } else {
      res.redirect('/');
    }
  });
});

router.get('/language-settings', (req, res) => {
  res.render('settings/languageSettings', { title: 'Language Settings', user: req.session.user });
});

router.get('/account-settings', (req, res) => {
  res.render('settings/accountSettings', { title: 'Account Settings', user: req.session.user });
});

router.post('/change-username', (req, res) => {
  const { newUsername } = req.body;
  const user = req.session.user;

  if (!user) {
    return res.status(401).send('User not authenticated');
  }

  if (newUsername.length < 3 || newUsername.length > 32) {
    return res.status(400).send('New username must have between 3 and 32 characters.');
  }

  const updateUsernameQuery = 'UPDATE users SET username = ? WHERE id = ?';
  db.query(updateUsernameQuery, [newUsername, user.id], (err, results) => {
    if (err) {
      console.error('Error updating username:', err);
      res.status(500).send('Server error');
    } else {
      req.session.user.username = newUsername;
      res.redirect('/account-settings');
    }
  });
});

router.post('/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = req.session.user;

  if (!user) {
    return res.status(401).send('User not authenticated');
  }

  const checkPasswordQuery = 'SELECT * FROM users WHERE id = ? AND password = ?';
  db.query(checkPasswordQuery, [user.id, oldPassword], (err, results) => {
    if (err) {
      console.error('Error checking old password:', err);
      return res.status(500).send('Server error');
    }

    if (results.length === 0) {
      return res.status(401).send('Incorrect old password');
    }

    const updatePasswordQuery = 'UPDATE users SET password = ? WHERE id = ?';
    db.query(updatePasswordQuery, [newPassword, user.id], (err, results) => {
      if (err) {
        console.error('Error updating password:', err);
        res.status(500).send('Server error');
      } else {
        res.redirect('/account-settings');
      }
    });
  });
});

router.post('/delete-account', (req, res) => {
  const { confirmDelete } = req.body;
  const user = req.session.user;

  if (!user) {
    return res.status(401).send('User not authenticated');
  }

  if (confirmDelete !== 'DELETE') {
    return res.status(400).send('Invalid confirmation for account deletion');
  }

  const deleteAccountQuery = 'DELETE FROM users WHERE id = ?';
  db.query(deleteAccountQuery, [user.id], (err, results) => {
    if (err) {
      console.error('Error deleting account:', err);
      res.status(500).send('Server error');
    } else {
      console.log('Account deleted successfully');

      req.session.user = null;

      req.session.destroy((err) => {
        if (err) {
          console.error('Error during logout:', err);
          res.status(500).send('Server error');
        } else {
          res.redirect('/');
        }
      });
    }
  });
});

router.post('/send-message', (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  if (!sender_id) {
    return res.status(400).send('Sender ID is required');
  }

  const insertMessageQuery = 'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)';
  db.query(insertMessageQuery, [sender_id, receiver_id, content], (err, results) => {
    if (err) {
      console.error('Error inserting message:', err);
      return res.status(500).send('Server error');
    }

    req.session.successMessage = 'Message sent successfully';
    res.redirect('/chat');
  });
});

router.get('/get-messages', (req, res) => {
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
      res.render('chat', { title: 'Chat', user, messages: results, users, receiver_id });
    }
  });
});


router.get('/get-messages/:sender_id/:receiver_id', (req, res) => {
  const { sender_id, receiver_id } = req.params;

  const getMessagesQuery = 'SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp';
  db.query(getMessagesQuery, [sender_id, receiver_id, receiver_id, sender_id], (err, results) => {
    if (err) {
      console.error('Error retrieving messages:', err);
      res.status(500).send('Server error');
    } else {
      res.render('chat', { title: 'Chat', user: req.session.user, messages: results, receiver_id });
    }
  });
});

router.get('/new-message/:receiver_id', (req, res) => {
  const user = req.session.user;
  const receiver_id = req.params.receiver_id;

  res.render('newMessage', { title: 'New Message', user, receiver_id });
});

router.get('/users', (req, res) => {
  const user = req.session.user;

  const getUsersQuery = 'SELECT * FROM users WHERE username NOT IN ("root", "admin")';
  db.query(getUsersQuery, (err, users) => {
    if (err) {
      console.error('Error retrieving users:', err);
      res.status(500).send('Server error');
    } else {
      res.render('users', { title: 'Liste des utilisateurs', user, users });
    }
  });
});

router.get('/new-message/:receiver_id', (req, res) => {
  const user = req.session.user;
  const receiver_id = req.params.receiver_id;

  res.render('newMessage', { title: 'Nouveau Message', user, receiver_id });
});

router.get('/get-messages/:sender_id/:receiver_id', (req, res) => {
  const { sender_id, receiver_id } = req.query;

  const getMessagesQuery = 'SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp';
  db.query(getMessagesQuery, [sender_id, receiver_id, receiver_id, sender_id], (err, results) => {
    if (err) {
      console.error('Error retrieving messages:', err);
      res.status(500).send('Server error');
    } else {
      res.render('chat', { title: 'Chat', user: req.session.user, messages: results, receiver_id });
    }
  });
});

router.get('/ressource',(req, res) => {
  const user = req.session.user;
  const customTitle = 'Ressources';
  res.render('ressource/ressource', { title: customTitle, user });
});

router.get('/cours',(req, res) => {
  const user = req.session.user;
  const customTitle = 'cours';
  res.render('ressource/cours/cours_index', { title: customTitle, user });
});

router.get('/cours_html_intro',(req, res) => {
  const user = req.session.user;
  const customTitle = 'Cours Html,CSS & JS';
  res.render('ressource/cours/html/1_Introduction/Introduction', { title: customTitle, user });
})

router.get('/cours_html_base',(req, res) => {
    const user = req.session.user;
    const customTitle = 'Cours Html,CSS & JS';
    res.render('ressource/cours/html/2_Les Base/Base_html', { title: customTitle, user });
})

router.get('/exercice',(req, res) => {
    const user = req.session.user;
    const customTitle = 'exercice';
    res.render('ressource/exercice/exercice_index', { title: customTitle, user });
})


router.get('/tp', (req, res) => {
    const user = req.session.user;
    const customTitle = 'tp';
    res.render('ressource/tp/tp_index', { title: customTitle, user });
})




module.exports = router;
