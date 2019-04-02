const joi = require('joi');
const boom = require('boom');
const accountService = require('../../services/accountService');
module.exports = {
  plugins: {
    'hapi-swagger': {
      payloadType: 'form',
    },
  },
  auth: {
    strategy: 'default'
  },
  tags: ['api', 'account'],
  description: 'Get user',
  notes: 'get user',
  validate: {  
    params: {
      _id: joi.string()
              .description('PK of user'),
    }
  },
  handler: async (request, reply) => {
    const userPool = request.server.plugins['cognito-auth'].userPool;
    const onError = err => {
      request.server.log(['error'], err);
      return reply(boom.badRequest(err));
    };
    // Fetch user
    await accountService
      .getUser(request.params._id, userPool)
      .then(reply)
      .catch(onError);
  }
};
