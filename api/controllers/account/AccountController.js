const prefix = '/account';

module.exports = [
  {
    path: `${prefix}/all`,
    method: 'GET',
    config: require('./getUsers'),
  },
  {
    path: `${prefix}/{_id?}`,
    method: 'GET',
    config: require('./getUser'),
  },
  {
    path: `${prefix}`,
    method: 'POST',
    config: require('./create'),
  },
  {
    path: `${prefix}/login`,
    method: 'POST',
    config: require('./login'),
  },
  {
    path: `${prefix}/verifyInviteToken`,
    method: 'POST',
    config: require('./verifyInviteToken'),
  },
  {
    path: `${prefix}/{_id}`,
    method: 'PUT',
    config: require('./update'),
  },
  {
		path: `${prefix}/updatePasswordWithToken`,
		method: 'PUT',
		config: require('./updatePasswordWithToken'),
	},
	{
		path: `${prefix}/updatePasswordWithoutToken`,
		method: 'PUT',
		config: require('./updatePasswordWithoutToken'),
	},
];
