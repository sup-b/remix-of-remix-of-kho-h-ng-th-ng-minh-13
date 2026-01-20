import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [imports] = await pool.query(`
      SELECT i.*, s.name as supplierName 
      FROM imports i 
      LEFT JOIN suppliers s ON i.supplierId = s.id 
      ORDER BY i.createdAt DESC
    `);
    
    // Get items for each import
    for (let imp of imports) {
      const [items] = await pool.query(`
        SELECT ii.*, p.name as productName, p.sku 
        FROM import_items ii 
        LEFT JOIN products p ON ii.productId = p.id 
        WHERE ii.importId = ?
      `, [imp.id]);
      imp.items = items;
    }
    
    res.json(imports);
  } catch (error) {
    console.error('Get imports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [imports] = await pool.query('SELECT * FROM imports WHERE id = ?', [req.params.id]);
    if (imports.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const [items] = await pool.query(`
      SELECT ii.*, p.name as productName, p.sku 
      FROM import_items ii 
      LEFT JOIN products p ON ii.productId = p.id 
      WHERE ii.importId = ?
    `, [req.params.id]);
    
    imports[0].items = items;
    res.json(imports[0]);
  } catch (error) {
    console.error('Get import error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const importData = req.body;
    const importId = generateId();
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create import
      await connection.query(
        'INSERT INTO imports (id, supplierId, date, totalAmount, notes) VALUES (?, ?, ?, ?, ?)',
        [importId, importData.supplierId, importData.date, importData.totalAmount || 0, importData.notes || '']
      );
      
      // Create import items and update product stock
      for (const item of importData.items || []) {
        const itemId = generateId();
        await connection.query(
          'INSERT INTO import_items (id, importId, productId, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?, ?)',
          [itemId, importId, item.productId, item.quantity, item.unitPrice, item.total]
        );
        
        // Update product stock
        await connection.query(
          'UPDATE products SET stockQty = stockQty + ? WHERE id = ?',
          [item.quantity, item.productId]
        );
      }
      
      await connection.commit();
      
      const [newImport] = await connection.query('SELECT * FROM imports WHERE id = ?', [importId]);
      res.status(201).json(newImport[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create import error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default router;

