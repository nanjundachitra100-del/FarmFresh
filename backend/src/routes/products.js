const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
  , uploadProductImage
} = require('../controllers/productsController');
const multer = require('multer');

// In-memory storage for uploads before sending to Supabase
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Product routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
// Image upload endpoint (multipart/form-data, field name: 'image')
router.post('/upload-image', upload.single('image'), uploadProductImage);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
