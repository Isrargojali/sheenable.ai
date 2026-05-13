const success = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, message });

const paginated = (res, data, pagination) =>
  res.status(200).json({ success: true, data, pagination });

const error = (res, message, statusCode = 400, errors = null) =>
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });

module.exports = { success, paginated, error };
