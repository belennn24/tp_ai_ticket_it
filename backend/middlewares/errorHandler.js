export const errorHandler = (err, req, res, next) => {
  const statusCode = Number(err.statusCode || err.status || 500);
  const esCliente = statusCode >= 400 && statusCode < 500;
  const statusStr = esCliente ? 'fail' : 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      status: statusStr,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    if (err.isOperational || esCliente) {
      res.status(statusCode).json({
        status: statusStr,
        message: err.message
      });
    } else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Algo salió mal'
      });
    }
  }
};
