const Joi = require("joi")

/**
 * Validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((detail) => detail.message),
      })
    }
    next()
  }
}

// Validation schemas
const schemas = {
  syncUser: Joi.object({
    supabaseUserId: Joi.string().required(),
    businessName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
  }),

  chatbotConfig: Joi.object({
    welcomeMessage: Joi.string().min(1).max(500).required(),
    themeColor: Joi.string()
      .pattern(/^#[0-9A-F]{6}$/i)
      .required(),
    faqs: Joi.array()
      .items(
        Joi.object({
          question: Joi.string().required(),
          answer: Joi.string().required(),
        }),
      )
      .max(50),
  }),

  message: Joi.object({
    message: Joi.string().min(1).max(1000).required(),
    sessionId: Joi.string().optional(),
    userInfo: Joi.object({
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
    }).optional(),
  }),
}

module.exports = { validate, schemas }