import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [customers] = await pool.query('SELECT * FROM customers ORDER BY createdAt DESC');
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (customers.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(customers[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const customer = req.body;
    const id = generateId();
    await pool.query(
      'INSERT INTO customers (id, name, phone, address, notes) VALUES (?, ?, ?, ?, ?)',
      [id, customer.name, customer.phone || '', customer.address || '', customer.notes || '']
    );
    const [newCustomer] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    res.status(201).json(newCustomer[0]);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const customer = req.body;
    await pool.query(
      'UPDATE customers SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ?',
      [customer.name, customer.phone, customer.address, customer.notes, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default router;

