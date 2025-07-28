const db = require('../models');
exports.saveMessage = (req, res) => {
  const { user_id, group_id, content } = req.body;
  if (!user_id || !group_id || !content) {
    return res.status(400).json({ message: 'Fields missing' });
  }
  db.query(
    'INSERT INTO messages (user_id, group_id, content, created_at) VALUES (?, ?, ?, NOW())',
    [user_id, group_id, content],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'DB error', error: err });
      res.status(201).json({ id: result.insertId });
    }
  );
};
exports.getMessages = (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.params.userId;
  db.query(
    'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
    [groupId, userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error', error: err });

      if (results.length === 0) {
        return res.status(403).json({ message: 'You are not a member of this group.' });
      }
      db.query(
        `SELECT m.id, m.content, m.created_at, u.name AS user
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.group_id = ?
         ORDER BY m.created_at ASC`,
        [groupId],
        (err2, messages) => {
          if (err2) return res.status(500).json({ message: 'DB error', error: err2 });
          res.status(200).json(messages);
        }
      );
    }
  );
};
