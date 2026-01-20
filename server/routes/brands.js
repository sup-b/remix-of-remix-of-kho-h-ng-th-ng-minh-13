import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [brands] = await pool.query('SELECT * FROM brands ORDER BY createdAt DESC');
    res.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [brands] = await pool.query('SELECT * FROM brands WHERE id = ?', [req.params.id]);
    if (brands.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(brands[0]);
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const brand = req.body;
    const id = generateId();
    await pool.query(
      'INSERT INTO brands (id, name, description, status) VALUES (?, ?, ?, ?)',
      [id, brand.name, brand.description || '', brand.status || 'active']
    );
    const [newBrand] = await pool.query('SELECT * FROM brands WHERE id = ?', [id]);
    res.status(201).json(newBrand[0]);
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const brand = req.body;
    await pool.query(
      'UPDATE brands SET name = ?, description = ?, status = ? WHERE id = ?',
      [brand.name, brand.description, brand.status, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM brands WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM brands WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default router;

