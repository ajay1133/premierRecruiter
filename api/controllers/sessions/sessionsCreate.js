const joi = require('joi');
const boom = require('boom');
const sessionService = require('../../services/sessionService');
const jwtHelper = require('../../helpers/jwtHelper');

module.exports = {
  plugins: {
    'hapi-swagger': {
      payloadType: 'form',
    },
  },
  tags: ['api', 'session'],
  description: 'Create session either via token or by email/password',
  notes: 'User login through token generation or input email/password',
  validate: {
    query: {
      jwt: joi.number()
              .valid(0, 1)
              .default(0)
              .description('set 1 to get jwt token'),
    },
    payload: {
	    token: joi.string()
	              .optional(),
      email: joi.string()
                .optional()
                .allow(['', null]),
      password: joi.string()
                   .optional()
                   .allow(['', null])
    },
    options: { abortEarly: false },
  },
  handler: async (request, h) => {
    const { token, email, password } = request.payload;
    const onError = err => {
      throw boom.badRequest(err);
    };
	  let user = {};
    try {
	    if (token) {
	      const decryptedData = await jwtHelper.verify(token);
		    user = await sessionService.authenticate(decryptedData.email, decryptedData.password);
      } else if (email && password) {
	      user = await sessionService.authenticate(email, password);
      }
      if (user) {
        let scope = ['user'];  
        if (user.role === 1) {
          scope.push('admin');
        } else {
          scope.push('customer');
        }
        user.scope = scope;
        if (request.query.jwt) {
          try {
            let accessToken =  await jwtHelper.sign(user);
            return h.response({ user, accessToken });
          } catch(err) {
            onError("Invalid Email or Password");
          }
        } else {
          request.auth.session.set(user);
          return h.response({ user });
        }
      } else {
        onError("Invalid Email or Password");
      }
    } catch(err) {
      onError("Invalid Email or Password");
    }
  },
};