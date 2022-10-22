const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
  '/login',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (!user) {
            return Promise.reject('Email doesnt exist');
          }
        });
      }),
  ],
  authController.postLogin
);

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
      })
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject('Email already exists.');
          }
        });
      }),
    body(
      'password',
      'Password should be atleast 5 characters in length and should contain alphanumeric characters'
    )
      .isLength({ min: 5 })
      // .withMessage('Password should be atleast 5 characters in length')
      .isAlphanumeric(),
    // .withMessage('Password should be only contains alphanumeric characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password and Confirm Password do not match');
      }

      return true;
    }),
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
