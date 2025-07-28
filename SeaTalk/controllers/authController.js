const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');

exports.signup = async (req, res) => {
  const { name, email, phone, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ? OR phone = ?',
    [email, phone],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      if (results.length > 0) {
        return res.status(400).json({ message: 'User already exists with this email or phone' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
        [name, email, phone, hashedPassword],
        (err, result) => {
          if (err) return res.status(500).json({ message: 'Error creating user' });

          return res.status(201).json({ message: 'User registered successfully' });
        }
      );
    }
  );
};

exports.login = async (req, res) => {
  const { email, password } = req.body;  

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, name: user.name },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, phone: user.phone }
    });
  });
};
