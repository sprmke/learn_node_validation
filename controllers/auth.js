const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { validationResult } = require('express-validator');

const getErrorMessage = (req) => {
  let errorMessage = req.flash('errorMessage');
  if (errorMessage.length > 0) {
    errorMessage = errorMessage[0];
  } else {
    errorMessage = null;
  }

  return errorMessage;
};

exports.getLogin = (req, res, next) => {
  const errorMessage = getErrorMessage(req);

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage,
  });
};

exports.getSignup = (req, res, next) => {
  const errorMessage = getErrorMessage(req);

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage,
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
    });
  }

  User.findOne({ email })
    .then((user) => {
      // validate password
      bcrypt
        .compare(password, user.password)
        .then((isMatched) => {
          if (isMatched) {
            // save session info
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              res.redirect('/');
            });
          }

          req.flash('errorMessage', 'Invalid email or password.');
          return req.session.save((err) => {
            res.redirect('/login');
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const { email, password } = req.body;

  // add validation here
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
    });
  }

  // User.findOne({ email })
  //   .then((user) => {
  //     // if user email already exist, redirect to signup page
  //     if (user) {
  //       req.flash('errorMessage', 'Email already exists.');
  //       return req.session.save((error) => {
  //         res.redirect('/signup');
  //       });
  //     }
  //   })

  // encrypt password
  bcrypt
    .hash(password, 12)
    .then((encryptedPassword) => {
      // create new user
      const user = new User({
        email,
        password: encryptedPassword,
        cart: { items: [] },
      });

      return user.save();
    })
    .then((result) => res.redirect('/login'))
    .catch((err) => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  const errorMessage = getErrorMessage(req);

  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');

    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('errorMessage', 'No account with that email found.');

          return req.session.save((err) => {
            res.redirect('/reset');
          });
        }

        // save reset token data to user
        const ONE_HOUR_IN_MS = 3600000;
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + ONE_HOUR_IN_MS;
        return user.save();
      })
      .then(async (result) => {
        if (result) {
          res.redirect('/');

          // send reset password email
          await sendResetPasswordEmail(req.body.email, token);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

const sendResetPasswordEmail = async (email, token) => {
  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  let info = await transporter.sendMail({
    from: '"Mike Cutie 👻" <mike@cutie.com>',
    to: email,
    subject: 'Password Reset',
    text: 'Password Reset!',
    html: `
      <p>You requested a password reset</p>
      <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
    `,
  });

  console.log('Message sent: %s', info.messageId);

  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};

exports.getNewPassword = (req, res, next) => {
  const { token } = req.params;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      const errorMessage = getErrorMessage(req);

      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const { password: newPassword, userId, passwordToken } = req.body;
  let resetUser;

  User.findOne({
    _id: userId,
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      resetUser = user;
      // encrypt password
      return bcrypt.hash(newPassword, 12);
    })
    .then((encryptedPassword) => {
      // update user password and token data
      resetUser.password = encryptedPassword;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = null;

      return resetUser.save();
    })
    .then((result) => res.redirect('/login'))
    .catch((err) => {
      console.log(err);
    });
};
