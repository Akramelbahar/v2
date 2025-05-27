// Standard success response
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };
  
  // Standard error response
  const sendError = (res, message = 'Error', statusCode = 400, error = null) => {
    const response = {
      success: false,
      message
    };
  
    if (error && process.env.NODE_ENV === 'development') {
      response.error = error;
    }
  
    res.status(statusCode).json(response);
  };
  
  // Pagination response
  const sendPaginatedResponse = (res, data, page, limit, total) => {
    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  };
  
  module.exports = {
    sendSuccess,
    sendError,
    sendPaginatedResponse
  };