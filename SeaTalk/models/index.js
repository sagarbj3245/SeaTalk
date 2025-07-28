const mysql = require('mysql2');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'seatalk',
  connectionLimit: 10
});

db.getConnection((err, connection) => {
  if (err) {
    console.error(' MySQL connection failed:', err);
  } else {
    console.log(' Connected to MySQL DB');
    connection.release();
  }
});

module.exports = db;
