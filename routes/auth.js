const express = require('express');
const { check, body } = require('express-validator/check');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        if (value === 'email@test.com') {
          throw new Error('Test email is not allowed');
        }

        return true;
      }),
    body(
      'password',
      'Password should be atleast 5 characters in length and should contain alphanumeric characters'
    )
      .isLength({ min: 5 })
      // .withMessage('Password should be atleast 5 characters in length')
      .isAlphanumeric(),
    // .withMessage('Password should be only contains alphanumeric characters'),
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
