const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
  
    // Log to console for dev
    if (process.env.NODE_ENV === 'development') {
      console.error(err);
    }
  
    // Sequelize bad request
    if (err.name === 'SequelizeValidationError') {
      const message = Object.values(err.errors).map(e => e.message).join(', ');
      error = {
        message,
        statusCode: 400
      };
    }
  
    // Sequelize duplicate key
    if (err.name === 'SequelizeUniqueConstraintError') {
      const message = 'Duplicate field value entered';
      error = {
        message,
        statusCode: 400
      };
    }
  
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  };
  
  module.exports = errorHandler;