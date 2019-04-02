const accountService = require('../../services/accountService');
module.exports = {
  plugins: {
    'hapi-swagger': {
      payloadType: 'form',
    },
  },
  auth: 'default',
  tags: ['api', 'session'],
  description: 'Get session user',
  notes: 'Returns logged in session user',
  handler: async (request, h) => {
    const userPool = request.server.plugins['cognito-auth'].userPool;
    let userId;
    userId = request.auth.credentials.id;
    let data = await accountService.getUser(userId, userPool);
    let userData = data.toJSON();
    if (request.auth.credentials.accessToken) {
      userData.accessToken = request.auth.credentials.accessToken;
      userData.refreshToken = request.auth.credentials.refreshToken;
    }
    return h.response(userData);
  }
};
