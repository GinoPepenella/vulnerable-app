const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, initializeDatabase } = require('./database');

const app = express();
const PORT = 3000;

const JWT_SECRET = 'super_secret_key_12345';

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

initializeDatabase();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

app.post('/api/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `INSERT INTO users (username, email, password, role) VALUES ('${username}', '${email}', '${hashedPassword}', '${role || 'user'}')`;

    db.run(query, function(err) {
      if (err) {
        return res.status(400).json({ error: 'User already exists or database error: ' + err.message });
      }
      res.json({ message: 'User registered successfully', userId: this.lastID });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const query = `SELECT * FROM users WHERE username = '${username}'`;

  db.get(query, async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role
    }, JWT_SECRET);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  });
});

app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';

  db.all(query, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json(products);
  });
});

app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;

  const query = `SELECT * FROM products WHERE id = ${productId}`;

  db.get(query, (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });
});

app.get('/api/products/:id/reviews', (req, res) => {
  const productId = req.params.id;

  const query = `SELECT reviews.*, users.username FROM reviews
                 JOIN users ON reviews.user_id = users.id
                 WHERE reviews.product_id = ${productId}
                 ORDER BY reviews.created_at DESC`;

  db.all(query, (err, reviews) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json(reviews);
  });
});

app.post('/api/reviews', authenticateToken, upload.single('image'), (req, res) => {
  const { product_id, rating, title, content } = req.body;
  const user_id = req.user.id;
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;

  if (!product_id || !rating || !title || !content) {
    return res.status(400).json({ error: 'Product ID, rating, title, and content are required' });
  }

  const query = `INSERT INTO reviews (product_id, user_id, rating, title, content, image_path)
                 VALUES (${product_id}, ${user_id}, ${rating}, '${title}', '${content}', '${image_path}')`;

  db.run(query, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json({ message: 'Review submitted successfully', reviewId: this.lastID });
  });
});

app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;

  const query = `SELECT id, username, email, role, created_at FROM users WHERE id = ${userId}`;

  db.get(query, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

app.put('/api/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;
  const updates = req.body;

  const fields = Object.keys(updates).map(key => `${key} = '${updates[key]}'`).join(', ');

  const query = `UPDATE users SET ${fields} WHERE id = ${userId}`;

  db.run(query, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json({ message: 'User updated successfully' });
  });
});

app.delete('/api/reviews/:id', authenticateToken, (req, res) => {
  const reviewId = req.params.id;

  const query = `DELETE FROM reviews WHERE id = ${reviewId}`;

  db.run(query, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json({ message: 'Review deleted successfully' });
  });
});

app.get('/api/admin/users', authenticateToken, (req, res) => {
  const query = 'SELECT id, username, email, role, created_at FROM users';

  db.all(query, (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json(users);
  });
});

app.get('/api/admin/reviews', authenticateToken, (req, res) => {
  const query = `SELECT reviews.*, users.username, products.name as product_name
                 FROM reviews
                 JOIN users ON reviews.user_id = users.id
                 JOIN products ON reviews.product_id = products.id
                 ORDER BY reviews.created_at DESC`;

  db.all(query, (err, reviews) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json(reviews);
  });
});

app.get('/api/search', (req, res) => {
  const searchTerm = req.query.q;

  if (!searchTerm) {
    return res.status(400).json({ error: 'Search term is required' });
  }

  const query = `SELECT * FROM products WHERE name LIKE '%${searchTerm}%' OR description LIKE '%${searchTerm}%'`;

  db.all(query, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json(products);
  });
});

app.get('/api/file', (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  const fullPath = path.join(__dirname, '..', filePath);

  fs.readFile(fullPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading file: ' + err.message });
    }
    res.send(data);
  });
});

app.get('/api/export/reviews', authenticateToken, (req, res) => {
  const format = req.query.format || 'json';
  const userId = req.query.user_id;

  let query = 'SELECT * FROM reviews';
  if (userId) {
    query += ` WHERE user_id = ${userId}`;
  }

  db.all(query, (err, reviews) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }

    if (format === 'json') {
      res.json(reviews);
    } else if (format === 'csv') {
      let csv = 'id,product_id,user_id,rating,title,content,created_at\n';
      reviews.forEach(review => {
        csv += `${review.id},${review.product_id},${review.user_id},${review.rating},"${review.title}","${review.content}",${review.created_at}\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.send(csv);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Default admin credentials: admin / admin123`);
  console.log(`Default user credentials: johndoe / password123`);
});
