const db = require('../models');
exports.getDirectMessages = (req, res) => {
  const { from, to } = req.params;

  db.query(
    `SELECT dm.id, dm.content, dm.created_at, u.name AS sender
     FROM direct_messages dm
     JOIN users u ON dm.sender_id = u.id
     WHERE (dm.sender_id = ? AND dm.receiver_id = ?)
        OR (dm.sender_id = ? AND dm.receiver_id = ?)
     ORDER BY dm.created_at ASC`,
    [from, to, to, from],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.status(200).json(results);
    }
  );
};

exports.addContact = (req, res) => {
  const userId = req.userId;
  const { contact_phone } = req.body;

  if (!contact_phone) {
    return res.status(400).json({ message: 'Contact phone required.' });
  }

  db.query(
    'SELECT id FROM users WHERE phone = ?',
    [contact_phone],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      if (results.length === 0) {
        return res.status(404).json({ message: 'No user with this phone.' });
      }

      const contactId = results[0].id;
      if (parseInt(userId) === contactId) {
        return res.status(400).json({ message: 'Cannot add yourself.' });
      }

      db.query(
        'INSERT IGNORE INTO contacts (user_id, contact_id) VALUES (?, ?)',
        [userId, contactId],
        (err2) => {
          if (err2) return res.status(500).json({ message: 'Insert error.' });
          res.status(201).json({ message: 'Contact added.', contact_id: contactId });
        }
      );
    }
  );
};


exports.getContacts = (req, res) => {
  const { userId } = req.params;

  db.query(
    `SELECT u.id, u.name, u.phone
     FROM contacts c
     JOIN users u ON c.contact_id = u.id
     WHERE c.user_id = ?`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.status(200).json(results);
    }
  );
};


exports.deleteContact = (req, res) => {
  const userId = req.userId;
  const contactId = req.params.contactId;

  db.query(
    'DELETE FROM contacts WHERE user_id = ? AND contact_id = ?',
    [userId, contactId],
    (err) => {
      if (err) return res.status(500).json({ message: 'Delete failed.' });
      res.status(200).json({ message: 'Contact deleted.' });
    }
  );
};
