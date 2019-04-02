// Api folder constants
exports.DEFAULT_USER_ATTRIBUTES = [
	'_id',
	'role',
	'email',
	'firstName',
	'lastName',
	'status'
];

exports.USER_AUTHENTICATION_ATTRIBUTES = [
	'_id',
	'email',
	'hash',
	'salt',
	'firstName',
	'lastName',
	'role',
	'status'
];

exports.DEFAULT_USER_ROLES = [ 2 ];

exports.RELATIONAL_MAPPING_LIST = [
	/*
	** Follow the format
	** {
	** 		primaryTable: 'primaryTable',
	**		secondaryTable: 'secondaryTable',
	**		targetKey: 'targetKey'
	** }
	*/
];