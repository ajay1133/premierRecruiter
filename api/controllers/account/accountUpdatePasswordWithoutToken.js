const joi = require('joi');
const boom = require('boom');
const accountService = require('../../services/accountService');
const sessionService = require('../../services/sessionService');

module.exports = {
  plugins: {
    'hapi-swagger': {
      payloadType: 'form',
    },
  },
  // auth: 'default',
  tags: ['api', 'account'],
  description: 'Update user',
  notes: 'update password',
  validate: {
    payload: {
	    email: joi.string()
	              .required()
	              .description('Email of User'),
	    currentPassword: joi.string()
	                        .required()
	                        .description('Current Password of User'),
      newPassword: joi.string()
                      .required()
                      .description('New Password of User'),
    },
    options: { abortEarly: false },
  },

  handler: async (request, h) => {
    const { email, currentPassword, newPassword } = request.payload;
	
	  try {
	    const user = await sessionService.authenticate(email, currentPassword);
	    if (user && user.id) {
		    let result = await accountService.updatePassword({
			    email,
			    password: newPassword
		    });
		    return h.response({ success: result });
	    } else {
	    	return boom.badRequest('Invalid Email or Password');
	    }
    } catch(err) {
      return boom.badImplementation(err);
    }
  }
};
