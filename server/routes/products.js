import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { includeDeleted = 'false' } = req.query;
    let query = 'SELECT * FROM products';
    
    if (includeDeleted === 'false') {
      query += ' WHERE isDeleted = FALSE';
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const [products] = await pool.query(query);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(products[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const product = req.body;
    const id = generateId();
    
    await pool.query(
      `INSERT INTO products (
        id, sku, name, type, groupId, brandId, config, costPrice, 
        salePriceBeforeTax, salePrice, vatImport, vatSale, stockQty, 
        minStock, maxStock, unit, status, imageUrl, images, notes, 
        description, warranty, directSale, loyaltyPoints, isDeleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, product.sku, product.name, product.type || 'product', 
        product.groupId || null, product.brandId || null,
        JSON.stringify(product.config || {}), product.costPrice || 0,
        product.salePriceBeforeTax || 0, product.salePrice || 0,
        product.vatImport || 0, product.vatSale || 0, product.stockQty || 0,
        product.minStock || 0, product.maxStock || 0, product.unit || 'cái',
        product.status || 'in_stock', product.imageUrl || null,
        JSON.stringify(product.images || []), product.notes || '',
        product.description || null, product.warranty || null,
        product.directSale || false, product.loyaltyPoints || false, false
      ]
    );
    
    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = req.body;
    
    await pool.query(
      `UPDATE products SET 
        sku = ?, name = ?, type = ?, groupId = ?, brandId = ?, config = ?,
        costPrice = ?, salePriceBeforeTax = ?, salePrice = ?, vatImport = ?,
        vatSale = ?, stockQty = ?, minStock = ?, maxStock = ?, unit = ?,
        status = ?, imageUrl = ?, images = ?, notes = ?, description = ?,
        warranty = ?, directSale = ?, loyaltyPoints = ?
      WHERE id = ?`,
      [
        product.sku, product.name, product.type, product.groupId || null,
        product.brandId || null, JSON.stringify(product.config || {}),
        product.costPrice, product.salePriceBeforeTax, product.salePrice,
        product.vatImport, product.vatSale, product.stockQty,
        product.minStock || 0, product.maxStock || 0, product.unit,
        product.status, product.imageUrl || null, JSON.stringify(product.images || []),
        product.notes || '', product.description || null, product.warranty || null,
        product.directSale || false, product.loyaltyPoints || false, req.params.id
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE products SET isDeleted = TRUE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default router;

