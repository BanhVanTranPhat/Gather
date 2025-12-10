/**
 * Input Validation Middleware
 * Basic validation helpers
 */

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (fields, data) => {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missing.join(', ')}`,
    };
  }
  return { isValid: true };
};

export const validateLength = (value, min, max, fieldName) => {
  if (value.length < min) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${min} characters`,
    };
  }
  if (max && value.length > max) {
    return {
      isValid: false,
      message: `${fieldName} must be at most ${max} characters`,
    };
  }
  return { isValid: true };
};

export const validateMessage = (req, res, next) => {
  const { message, type } = req.body;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message content is required',
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'Message is too long (max 2000 characters)',
    });
  }

  const validTypes = ['global', 'dm', 'nearby', 'group'];
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid message type. Must be one of: ${validTypes.join(', ')}`,
    });
  }

  next();
};

export const validateChannel = (req, res, next) => {
  const { name, type } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Channel name is required',
    });
  }

  if (name.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Channel name is too long (max 100 characters)',
    });
  }

  const validTypes = ['text', 'voice'];
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid channel type. Must be one of: ${validTypes.join(', ')}`,
    });
  }

  next();
};

