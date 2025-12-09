const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      api_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('password123', 10);

    db.run(`INSERT OR IGNORE INTO users (id, username, email, password, role)
            VALUES (1, 'admin', 'admin@reviewplatform.com', ?, 'admin')`, [adminPassword]);

    db.run(`INSERT OR IGNORE INTO users (id, username, email, password, role)
            VALUES (2, 'johndoe', 'john@example.com', ?, 'user')`, [userPassword]);

    db.run(`INSERT OR IGNORE INTO products (name, description, category) VALUES
            ('Wireless Headphones', 'Premium noise-cancelling wireless headphones', 'Electronics'),
            ('Smart Watch', 'Fitness tracking smart watch with heart rate monitor', 'Electronics'),
            ('Coffee Maker', 'Automatic drip coffee maker with programmable timer', 'Home'),
            ('Running Shoes', 'Lightweight running shoes with cushioned sole', 'Sports'),
            ('Laptop Backpack', 'Durable backpack with padded laptop compartment', 'Accessories')`);

    db.run(`INSERT OR IGNORE INTO reviews (product_id, user_id, rating, title, content) VALUES
            (1, 2, 5, 'Amazing sound quality!', 'These headphones are incredible. The noise cancellation works perfectly.'),
            (2, 2, 4, 'Great for fitness tracking', 'Love the heart rate monitor but battery could be better.')`);
  });
}

module.exports = { db, initializeDatabase };
