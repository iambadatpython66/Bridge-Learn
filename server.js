const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      user_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Users table ready');
    }
  });
}

app.post('/api/register', (req, res) => {
  const { fullName, email, userType } = req.body;

  if (!fullName || !email || !userType) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  const stmt = db.prepare('INSERT INTO users (full_name, email, user_type) VALUES (?, ?, ?)');
  
  stmt.run(fullName, email, userType, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ 
          success: false, 
          message: 'This email is already registered' 
        });
      }
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error registering user' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Registration successful!',
      userId: this.lastID
    });
  });

  stmt.finalize();
});

app.get('/api/users', (req, res) => {
  db.all('SELECT id, full_name, email, user_type, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching users' 
      });
    }
    res.json({ success: true, users: rows });
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
    process.exit(0);
  });
});
