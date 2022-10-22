const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  '/add-product',
  isAuth,
  [
    body('title')
      .isString()
      .withMessage('Please enter a valid title')
      .isLength({ min: 3 })
      .withMessage('Title should be atleast 3 characters in length')
      .trim(),
    body('imageUrl')
      .isURL()
      .withMessage('Please enter a valid image URL')
      .trim(),
    body('price').isCurrency().withMessage('Please enter a valid price'),
    body('description')
      .isLength({ min: 5, max: 400 })
      .withMessage('Description should be 5-400 characters in length')
      .trim(),
  ],
  adminController.postAddProduct
);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', isAuth, adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;
