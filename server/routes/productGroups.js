import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [groups] = await pool.query('SELECT * FROM product_groups ORDER BY createdAt DESC');
    res.json(groups);
  } catch (error) {
    console.error('Get product groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [groups] = await pool.query('SELECT * FROM product_groups WHERE id = ?', [req.params.id]);
    if (groups.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(groups[0]);
  } catch (error) {
    console.error('Get product group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const group = req.body;
    const id = generateId();
    await pool.query(
      'INSERT INTO product_groups (id, name, minPrice, maxPrice, description, configTemplate, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, group.name, group.minPrice || 0, group.maxPrice || 0, group.description || '', JSON.stringify(group.configTemplate || {}), group.status || 'active']
    );
    const [newGroup] = await pool.query('SELECT * FROM product_groups WHERE id = ?', [id]);
    res.status(201).json(newGroup[0]);
  } catch (error) {
    console.error('Create product group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const group = req.body;
    await pool.query(
      'UPDATE product_groups SET name = ?, minPrice = ?, maxPrice = ?, description = ?, configTemplate = ?, status = ? WHERE id = ?',
      [group.name, group.minPrice, group.maxPrice, group.description, JSON.stringify(group.configTemplate || {}), group.status, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM product_groups WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update product group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM product_groups WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete product group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default router;

