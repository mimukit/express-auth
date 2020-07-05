// Express Snippet

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// app config middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// other config middlewares
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());

const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.json({
    message: 'hello world',
  });
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
