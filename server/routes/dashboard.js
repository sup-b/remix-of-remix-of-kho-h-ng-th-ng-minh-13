import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Total products
    const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products WHERE isDeleted = FALSE');
    const totalProducts = productCount[0].count;
    
    // Total stock
    const [stockSum] = await pool.query('SELECT SUM(stockQty) as total FROM products WHERE isDeleted = FALSE');
    const totalStock = stockSum[0].total || 0;
    
    // Today revenue
    const [todayRevenue] = await pool.query(
      'SELECT SUM(totalAmount) as total FROM invoices WHERE DATE(date) = ?',
      [today]
    );
    const todayRev = todayRevenue[0].total || 0;
    
    // Week revenue
    const [weekRevenue] = await pool.query(
      'SELECT SUM(totalAmount) as total FROM invoices WHERE DATE(date) >= ?',
      [weekAgo]
    );
    const weekRev = weekRevenue[0].total || 0;
    
    // Month revenue
    const [monthRevenue] = await pool.query(
      'SELECT SUM(totalAmount) as total FROM invoices WHERE DATE(date) >= ?',
      [monthAgo]
    );
    const monthRev = monthRevenue[0].total || 0;
    
    // Today orders
    const [todayOrders] = await pool.query(
      'SELECT COUNT(*) as count FROM invoices WHERE DATE(date) = ?',
      [today]
    );
    const todayOrd = todayOrders[0].count;
    
    // Low stock products
    const [lowStock] = await pool.query(`
      SELECT * FROM products 
      WHERE isDeleted = FALSE 
      AND stockQty <= minStock 
      AND minStock > 0
      ORDER BY stockQty ASC
      LIMIT 10
    `);
    
    // Top selling products
    const [topSelling] = await pool.query(`
      SELECT p.*, SUM(ii.quantity) as totalQuantity
      FROM invoice_items ii
      JOIN products p ON ii.productId = p.id
      WHERE p.isDeleted = FALSE
      GROUP BY p.id
      ORDER BY totalQuantity DESC
      LIMIT 10
    `);
    
    res.json({
      totalProducts,
      totalStock,
      todayRevenue: todayRev,
      weekRevenue: weekRev,
      monthRevenue: monthRev,
      todayOrders: todayOrd,
      lowStockProducts: lowStock,
      topSellingProducts: topSelling
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

