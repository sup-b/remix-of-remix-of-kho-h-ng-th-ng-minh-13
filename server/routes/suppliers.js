import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [suppliers] = await pool.query('SELECT * FROM suppliers ORDER BY createdAt DESC');
    res.json(suppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [suppliers] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (suppliers.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(suppliers[0]);
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const supplier = req.body;
    const id = generateId();
    await pool.query(
      'INSERT INTO suppliers (id, name, phone, address, notes) VALUES (?, ?, ?, ?, ?)',
      [id, supplier.name, supplier.phone || '', supplier.address || '', supplier.notes || '']
    );
    const [newSupplier] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.status(201).json(newSupplier[0]);
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const supplier = req.body;
    await pool.query(
      'UPDATE suppliers SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ?',
      [supplier.name, supplier.phone, supplier.address, supplier.notes, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default router;

