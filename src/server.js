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

const generateOtp = () => Math.floor(1000 + Math.random() * 9000);

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
    return;
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
    return;
  }

  const { email, password } = inputData;

  try {
    // user exists & get data
    const [user] = await db.query('SELECT * FROM users WHERE email=?', [email]);

    if (!user.length) {
      const error = new Error('User not found');
      res.status(404);
      next(error);
      return;
    }

    // pass validate
    const isValidPassword = await bcrypt.compare(password, user[0].password);

    if (!isValidPassword) {
      const error = new Error('Login failed.');
      res.status(400);
      next(error);
      return;
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
  }
});

// login with phone & otp

app.post('/api/loginWithPhone', async (req, res, next) => {
  const inputData = req.body; // email pass

  // input data validation
  const loginWithPhoneSchema = yup.object().shape({
    phone: yup.string().min(11).required(),
  });

  try {
    await loginWithPhoneSchema.validate(inputData);
  } catch (error) {
    res.status(400);
    next(error);
    return;
  }

  const { phone } = inputData;

  // TODO: format phone number

  try {
    // user exists & get data
    const [user] = await db.query('SELECT * FROM users WHERE phone=?', [phone]);

    if (!user.length) {
      const error = new Error('User not found');
      res.status(404);
      next(error);
      return;
    }

    // gernerate opt & save to db

    const otp = generateOtp();

    const [
      result,
    ] = await db.query(
      'UPDATE `expressAuth`.`users` SET `opt` = ? WHERE `id` = ?;',
      [otp, user[0].id]
    );

    console.info(`OTP for user: ${otp}`);

    // return response
    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
});

// validate phone otp

app.post('/api/validateOtp', async (req, res, next) => {
  const inputData = req.body; // phone otp

  // input data validation
  const validateOtpSchema = yup.object().shape({
    phone: yup.string().min(11).required(),
    otp: yup.string().min(4).required(),
  });

  try {
    await validateOtpSchema.validate(inputData);
  } catch (error) {
    res.status(400);
    next(error);
    return;
  }

  const { phone, otp } = inputData;

  // TODO: format phone number

  try {
    // user exists & get data
    const [user] = await db.query('SELECT * FROM users WHERE phone=?', [phone]);

    if (!user.length) {
      const error = new Error('User not found');
      res.status(404);
      next(error);
      return;
    }

    // match otp

    if (!user[0].opt) {
      const error = new Error('Login failed.');
      res.status(400);
      next(error);
      return;
    }

    const isValidOtp = otp.toString() === user[0].opt.toString();

    if (!isValidOtp) {
      const error = new Error('Login failed.');
      res.status(400);
      next(error);
      return;
    }

    // TODO: remove otp from db if success

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

// user details api

app.get('/api/me', async (req, res, next) => {
  // check authorized
  const tokenHeader = req.headers.authorization || '';

  if (!tokenHeader) {
    const error = new Error('Unauthorized');
    res.status(401);
    next(error);
    return;
  }

  const token = tokenHeader.replace('Bearer ', '');
  const { userId } = jwt.verify(token, process.env.JWT_SECRET);

  // get logged user from db

  try {
    // get user data if found
    const [
      user,
    ] = await db.query(
      'SELECT name, phone, email, createdAt FROM users WHERE id=?',
      [userId]
    );

    if (!user.length) {
      const error = new Error('No data found');
      res.status(404);
      next(error);
      return;
    }

    // return response
    res.json({
      success: true,
      user: user[0],
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
});

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
