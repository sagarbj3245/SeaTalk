const db = require('../models');

exports.getUserGroups = (req, res) => {
  const userId = req.params.userId;
  db.query(
    `SELECT g.id, g.name 
     FROM \`groups\` g 
     JOIN group_members gm ON gm.group_id = g.id 
     WHERE gm.user_id = ?`,
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error', error: err });
      res.json(result);
    }
  );
};

exports.getUserContacts = (req, res) => {
  const userId = req.params.userId;
  db.query(
    `SELECT u.id, u.name, u.phone 
     FROM users u 
     JOIN contacts c ON c.contact_id = u.id 
     WHERE c.user_id = ?`,
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error', error: err });
      res.json(result);
    }
  );
};

exports.isMember = (req, res) => {
  const { groupId, userId } = req.params;
  db.query(
    'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
    [groupId, userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Error', error: err });
      res.json({ isMember: results.length > 0 });
    }
  );
};

exports.createGroup = (req, res) => {
  const io = req.app.get('io');
  const { name, created_by, contacts } = req.body;

  if (!name || !created_by) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const sql = `INSERT INTO \`groups\` (name, created_by, created_at) VALUES (?, ?, NOW())`;

  db.query(sql, [name, created_by], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });

    const groupId = result.insertId;
    const contactList = Array.isArray(contacts) ? contacts : [];

    const members = [
      created_by,
      ...contactList.filter(uid => uid != created_by)
    ].map(uid => [uid, groupId, uid == created_by ? true : false, new Date()]);

    const sql2 = `INSERT INTO group_members (user_id, group_id, is_admin, joined_at) VALUES ?`;

    db.query(sql2, [members], err2 => {
      if (err2) return res.status(500).json({ error: 'Could not add group members.' });

      contactList.forEach(uid => {
        io.to(uid.toString()).emit('group_update', { groupId, name });
      });
      io.to(created_by.toString()).emit('group_update', { groupId, name });

      res.status(201).json({ message: 'Group created', groupId });
    });
  });
};

exports.addMember = (req, res) => {
  const io = req.app.get('io');
  const { groupId } = req.params;
  const { newUserId } = req.body;
  const currentUserId = req.userId;

  db.query(
    'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND is_admin = TRUE',
    [groupId, currentUserId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error', error: err });
      if (results.length === 0) return res.status(403).json({ message: 'Only admins can add members.' });

      db.query(
        'INSERT IGNORE INTO group_members (user_id, group_id) VALUES (?, ?)',
        [newUserId, groupId],
        (err) => {
          if (err) return res.status(500).json({ message: 'DB error', error: err });

          io.to(newUserId.toString()).emit('group_update', { groupId });
          io.to(currentUserId.toString()).emit('group_update', { groupId });

          res.status(201).json({ message: 'Member added.' });
        }
      );
    }
  );
};

exports.removeMember = (req, res) => {
  const io = req.app.get('io');
  const { groupId } = req.params;
  const { removeUserId } = req.body;
  const currentUserId = req.userId;

  db.query(
    'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND is_admin = TRUE',
    [groupId, currentUserId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error', error: err });
      if (results.length === 0) return res.status(403).json({ message: 'Only admins can remove members.' });

      db.query(
        'DELETE FROM group_members WHERE user_id = ? AND group_id = ?',
        [removeUserId, groupId],
        (err) => {
          if (err) return res.status(500).json({ message: 'DB error', error: err });

          io.to(removeUserId.toString()).emit('group_update', { groupId, removed: true });
          io.to(currentUserId.toString()).emit('group_update', { groupId });

          res.status(200).json({ message: 'Member removed.' });
        }
      );
    }
  );
};

exports.promoteMember = (req, res) => {
  const io = req.app.get('io');
  const { groupId } = req.params;
  const { promoteUserId } = req.body;
  const currentUserId = req.userId;

  db.query(
    'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND is_admin = TRUE',
    [groupId, currentUserId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error', error: err });
      if (results.length === 0) return res.status(403).json({ message: 'Only admins can promote members.' });

      db.query(
        'UPDATE group_members SET is_admin = TRUE WHERE user_id = ? AND group_id = ?',
        [promoteUserId, groupId],
        (err) => {
          if (err) return res.status(500).json({ message: 'DB error', error: err });

          io.to(promoteUserId.toString()).emit('group_update', { groupId, promoted: true });
          io.to(currentUserId.toString()).emit('group_update', { groupId });

          res.status(200).json({ message: 'Member promoted to admin.' });
        }
      );
    }
  );
};
