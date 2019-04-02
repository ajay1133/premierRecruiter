const joi = require('joi');
const boom = require('boom');
const commonService = require('../../services/commonService');
module.exports = {
  plugins: {
    'hapi-swagger': {
      payloadType: 'form',
    },
  },
  auth: {
    strategy: 'default'
  },
  tags: ['api', 'common'],
  description: 'Create table data in bulk',
  notes: 'Create table data in bulk',
  validate: {
    payload: {
    	table: joi.string()
	              .required()
	              .description('Table to create an entry'),
      dataListOfObjects: joi.array()
                            .required()
                            .single()
                            .description('Data list of objects to insert in table')
    },
    options: { abortEarly: false },
  },
  handler: async (request, h) => {
    const { payload } = request;
    const { table, dataListOfObjects } = payload;
    try {
      const data = await commonService.bulkInsertTableData(table, dataListOfObjects);
      return h.response(data);
    } catch(err) {
      return boom.badRequest(err);
    }
  }
};
