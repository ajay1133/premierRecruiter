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
  description: 'Get all users',
  notes: 'Get all users',
  validate: {
    query: {
      status: joi.number()
                 .allow(['', null])
                 .description('1=Active, 2=Pending, 3=Denied'),
      keyword: joi.string()
                 .allow(['', null])
                 .description('Search keyword: Title, Description'),
      page: joi.string()
               .allow(['', null])
               .description('page number to get list of Account'),
      limit: joi.string()
                .allow(['', null])
                .description('number of account per page'),
	    order: joi.string()
	              .allow(['', null])
	              .description('JSON stringified array of order'),
      gender: joi.string()
	              .allow(['', null])
	              .description('string of gender id separated by comma, no spaces allowed'),
      age: joi.string()
	              .allow(['', null])
	              .description('string of age id separated by comma, no spaces allowed'),
      insurance: joi.string()
	              .allow(['', null])
	              .description('string of insurance id separated by comma, no spaces allowed')
    },
    options: { abortEarly: false },
  },
  handler: async (request, h) => {
    const { query } = request;
    try {
      let data = await accountService.getAllAccounts(query);
      return h.response(data);
    } catch(err) {
      return boom.badRequest(err);
    }
  }

};
