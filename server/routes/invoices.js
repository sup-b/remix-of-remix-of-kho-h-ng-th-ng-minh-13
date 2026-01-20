import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [invoices] = await pool.query(`
      SELECT i.*, c.name as customerName 
      FROM invoices i 
      LEFT JOIN customers c ON i.customerId = c.id 
      ORDER BY i.createdAt DESC
    `);
    
    // Get items for each invoice
    for (let invoice of invoices) {
      const [items] = await pool.query(`
        SELECT ii.*, p.name as productName, p.sku 
        FROM invoice_items ii 
        LEFT JOIN products p ON ii.productId = p.id 
        WHERE ii.invoiceId = ?
      `, [invoice.id]);
      invoice.items = items;
    }
    
    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [invoices] = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (invoices.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const [items] = await pool.query(`
      SELECT ii.*, p.name as productName, p.sku 
      FROM invoice_items ii 
      LEFT JOIN products p ON ii.productId = p.id 
      WHERE ii.invoiceId = ?
    `, [req.params.id]);
    
    invoices[0].items = items;
    res.json(invoices[0]);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const invoiceData = req.body;
    const invoiceId = generateId();
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create invoice
      await connection.query(
        `INSERT INTO invoices (
          id, customerId, date, subtotal, discountType, discountValue, 
          discountAmount, totalAmount, paymentMethod, amountPaid, change, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId, invoiceData.customerId || null, invoiceData.date,
          invoiceData.subtotal || 0, invoiceData.discountType || 'amount',
          invoiceData.discountValue || 0, invoiceData.discountAmount || 0,
          invoiceData.totalAmount || 0, invoiceData.paymentMethod || 'cash',
          invoiceData.amountPaid || 0, invoiceData.change || 0, invoiceData.notes || ''
        ]
      );
      
      // Create invoice items and update product stock
      for (const item of invoiceData.items || []) {
        const itemId = generateId();
        await connection.query(
          'INSERT INTO invoice_items (id, invoiceId, productId, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?, ?)',
          [itemId, invoiceId, item.productId, item.quantity, item.unitPrice, item.total]
        );
        
        // Update product stock (decrease)
        await connection.query(
          'UPDATE products SET stockQty = stockQty - ? WHERE id = ?',
          [item.quantity, item.productId]
        );
      }
      
      await connection.commit();
      
      const [newInvoice] = await connection.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
      res.status(201).json(newInvoice[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default router;

