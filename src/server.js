// Express Snippet

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const yup = require('yup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('./db');

const app = express();

// app config middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// other config middlewares
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());

const port = process.env.PORT || 4000;

// register
app.post('/api/register', async (req, res, next) => {
  const inputData = req.body;

  // input data validation
  const registerSchema = yup.object().shape({
    name: yup.string().trim(),
    phone: yup.string().min(11).required(), // TODO: phone validate regex
    email: yup.string().email().required(), // TODO: email validate rethink
    password: yup.string().trim().min(6).required(),
  });

  try {
    await registerSchema.validate(inputData);
  } catch (error) {
    res.status(400);
    next(error);
  }

  const { name, phone, email, password } = inputData;

  // TODO: phone number format

  // hash password
  try {
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    // save to db
    const [
      results,
    ] = await db.query(
      'INSERT INTO `expressAuth`.`users` (`name`, `phone`, `email`, `password`) VALUES (?, ?, ?, ?);',
      [name, phone, email, hashedPassword]
    );

    // return response
    res.json({
      success: true,
      id: results.insertId,
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
});

// login with email password
app.post('/api/loginWithEmail', async (req, res, next) => {
  const inputData = req.body; // email pass

  // input data validation
  const loginWithEmailSchema = yup.object().shape({
    email: yup.string().email().required(), // TODO: email validate rethink
    password: yup.string().trim().min(6).required(),
  });

  try {
    await loginWithEmailSchema.validate(inputData);
  } catch (error) {
    res.status(400);
    next(error);
  }

  const { email, password } = inputData;

  try {
    // user exists & get data
    const [user] = await db.query('SELECT * FROM users WHERE email=?', [email]);

    if (!user.length) {
      const error = new Error('User not found');
      res.status(404);
      next(error);
    }

    // pass validate
    const isValidPassword = await bcrypt.compare(password, user[0].password);

    if (!isValidPassword) {
      const error = new Error('Login failed.');
      res.status(400);
      next(error);
    }

    // generate jwt token
    const token = jwt.sign({ userId: user[0].id }, process.env.JWT_SECRET);

    // return response
    res.json({
      success: true,
      token,
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
});

// TODO: login with phone & otp

//

// Not found middleware
app.use((req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Error handler middleware
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json({
    status: statusCode,
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? '' : error.stack,
  });
});

// start app
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
