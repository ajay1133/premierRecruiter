const prefix = '/common';

module.exports = [
	{
		path: `${prefix}/insert`,
		method: 'POST',
		config: require('./insertTableData'),
	},
  {
    path: `${prefix}/bulkInsert`,
    method: 'POST',
    config: require('./bulkInsertTableData'),
  },
  {
    path: `${prefix}/update`,
    method: 'POST',
    config: require('./updateTableData'),
  },
  {
    path: `${prefix}/delete`,
    method: 'POST',
    config: require('./deleteTableData'),
  },
	{
		path: `${prefix}/bulkDelete`,
		method: 'POST',
		config: require('./bulkDeleteTableData'),
	}
];
