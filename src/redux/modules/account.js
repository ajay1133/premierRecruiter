import Immutable from 'immutable';
import {
	strictValidObjectWithKeys,
	typeCastToString,
	strictValidArrayWithLength,
	strictValidString,
	validObjectWithParameterKeys,
	strictValidArray,
	strictValidObject,
	typeCastToKeyValueObject
} from '../../utils/commonutils';
import {
	DEFAULT_MILLISECONDS_TO_SHOW_MESSAGES,
	RELATIONAL_MAPPING_INFO_LIST,
	DEFAULT_ACCOUNT_LIST_FILTERS
} from '../../utils/constants';

// Action creators
// Loading
const LOAD = 'account/LOAD';
const LOAD_SUCCESS = 'account/LOAD_SUCCESS';
const LOAD_FAIL = 'account/LOAD_FAIL';
// Accounts
const LOAD_ACCOUNTS = 'account/LOAD_ACCOUNTS';
// Verification of invite token
const VERIFY_TOKEN = 'account/VERIFY_TOKEN';
const VERIFY_TOKEN_SUCCESS = 'account/VERIFY_TOKEN_SUCCESS';
const VERIFY_TOKEN_FAIL = 'account/VERIFY_TOKEN_FAIL';
// Update user password
const UPDATE_PASSWORD = 'account/UPDATE_PASSWORD';
const UPDATE_PASSWORD_SUCCESS = 'account/UPDATE_PASSWORD_SUCCESS';
const UPDATE_PASSWORD_FAIL = 'account/UPDATE_PASSWORD_FAIL';
// Assign selected user during edit user to 'selectedUser' object
const SELECT_USER = 'account/SELECT_USER';
// Reset reducer
const RESET_MESSAGE = 'account/RESET_MESSAGE';
const FLUSH = 'account/FLUSH';

const initialState = Immutable.fromJS({
	isLoad: false,
	message: null,
  loadErr: null,
  items: [],
  itemsCount: 0,
	itemsFilters: DEFAULT_ACCOUNT_LIST_FILTERS,
  selectedUser: {},
	passwordUpdated: false,
	passwordUpdatedMsg: null,
	relationalMappedData: {}
});

const internals = {};

export default function reducer(state = initialState, action) {
  switch (action.type) {
		// Loading
    case LOAD:
      return state
        .set('isLoad', true)
        .set('loadErr', null);
    case LOAD_SUCCESS:
      return state
        .set('isLoad', false)
				.set('loadErr', null)
				.set(
					'message', 
					(
						validObjectWithParameterKeys(action, ['message']) && 
						typeCastToString(action.message)
					) || null
				);
    case LOAD_FAIL:
      return state
        .set('isLoad', false)
        .set(
					'loadErr', 
					(
						validObjectWithParameterKeys(action, ['error']) && 
						typeCastToString(action.error)
					) || null
				);
		// Accounts		
		case LOAD_ACCOUNTS:		
			return state
        .set(
					'items', 
					(
						validObjectWithParameterKeys(action, ['items']) && 
						strictValidArray(action.items) &&
						action.items
					) || 
					typeCastToKeyValueObject(state, ['items']).items ||
					[]
				)
				.set(
					'itemsCount', 
					(
						validObjectWithParameterKeys(action, ['itemsCount']) 
							? action.itemsCount 
							: typeCastToKeyValueObject(state, ['itemsCount']).itemsCount || 0
					)
				)
	      .set(
					'itemsFilters',
					(
						validObjectWithParameterKeys(action, ['itemsFilters']) && 
						strictValidObject(action.itemsFilters) &&
						action.itemsFilters
					) || 
					typeCastToKeyValueObject(state, ['itemsFilters']).itemsFilters || 
					DEFAULT_ACCOUNT_LIST_FILTERS
				);
		// Verification of invite token		
    case VERIFY_TOKEN:
      return state
        .set('tokenValid', false)
        .set('confirmationErr', null);
    case VERIFY_TOKEN_SUCCESS:
      return state
        .set('tokenValid', action.res.tokenValid )
        .set('confirmationErr', action.res.tokenValid ? null : 'Invalid Token');
    case VERIFY_TOKEN_FAIL:
      return state
        .set('tokenValid', false)
        .set('confirmationErr', typeCastToString(action.error));
    // Update user password
    case UPDATE_PASSWORD:
      return state
        .set('updatingPassword', true)
        .set('passwordUpdated', false)
        .set('confirmationErr', null);
    case UPDATE_PASSWORD_SUCCESS:
      return state
        .set('updatingPassword', false)
        .set('passwordUpdated', true)
        .set('passwordUpdatedMsg', 'Please login using your new password')
        .set('confirmationErr', null);
    case UPDATE_PASSWORD_FAIL:
      return state
        .set('updatingPassword', false)
        .set('passwordUpdated', false)
        .set('confirmationErr', typeCastToString(action.error));
    // Assign selected user during edit user to 'selectedUser' object    
    case SELECT_USER:
      return state
				.set(
					'selectedUser', 
					(
						validObjectWithParameterKeys(action, ['selectedUser']) &&
						strictValidObjectWithKeys(action.selectedUser) && 
						action.selectedUser
					) || {}
				);
		// Reset reducer		
    case RESET_MESSAGE:
		  return state
			  .set('message', null)
			  .set('passwordUpdatedMsg', null)
			  .set('loadErr', null)
			  .set('confirmationErr', null);
	  case FLUSH: {
		  return initialState;
		}
		// Default case
    default:
      return state;
  }
}

/**
 * To load users account details
 * Access role allowed - admin
 * @param filters object
 */
export const loadAccounts = filters => async (dispatch, getState, api) => {
  dispatch({ type: LOAD });
  try {
		// Check if valid filters
  	const itemsFilters = (strictValidObjectWithKeys(filters) && filters) ||
			getState().get('account').get('itemsFilters');
		// If 'order' key is present in filters	
  	if (strictValidArrayWithLength(itemsFilters.order)) {
  	  itemsFilters.order = JSON.stringify(itemsFilters.order);
		}
		// Get users list from get api
		const res = await api.get('/account/all', { params: itemsFilters });
    // If caught error with error message
		if (validObjectWithParameterKeys(res, ['message'])) {
			dispatch({ type: LOAD_FAIL, error: typeCastToString(res.message) });
			return;
		}
		// If valid result with rows & count keys
		if (validObjectWithParameterKeys(res, ['rows', 'count'])) {
			if (strictValidString(itemsFilters.order)) {
				itemsFilters.order = (
          validObjectWithParameterKeys(filters, ['order']) && 
          filters.order
        ) || 
        getState().get('contact').get('itemsFilters').order;
			}
			dispatch({
				type: LOAD_ACCOUNTS,
				items: res.rows,
				itemsCount: res.count,
				itemsFilters
			});
		}
		dispatch({ type: LOAD_SUCCESS });
  } catch (err) {
    // If an error occurs, set error field
    await dispatch({ 
			type: LOAD_FAIL, 
			error: (validObjectWithParameterKeys(err, ['message']) && typeCastToString(err.message)) || typeCastToString(err) 
		});
	  dispatch(internals.resetMessage());
  }
};

/**
 * To add user account details
 * Access role allowed - admin
 * @param accountDetails object
 */
export const saveAccount = accountDetails => async (dispatch, getState, api) => {
  dispatch({ type: LOAD });
  try {
		// Insert in db using post api
		const res = await api.post('/account', { data: accountDetails });
    // If result is valid
    if (validObjectWithParameterKeys(res, ['_id', 'status'])) {
			await dispatch(loadAccounts());
	    await dispatch({ type: LOAD_SUCCESS, message: 'Added Successfully' });
	    dispatch(internals.resetMessage());
    }
  } catch (err) {
		// If an error occurs, set error field
    await dispatch({ 
			type: LOAD_FAIL, 
			error: (validObjectWithParameterKeys(err, ['message']) && typeCastToString(err.message)) || typeCastToString(err) 
		});
	  dispatch(internals.resetMessage());
  }
};

/**
 * To update user account details
 * Access role allowed - admin
 * @param accountDetails object
 */
export const updateAccount = accountDetails => async (dispatch, getState, api) => {
  dispatch({ type: LOAD });
  try {
		// Get users object from reducer
		let users = getState().get('account').get('items');
		let selectedUser = {};
		// Fetch user id & delete it from accountDetails object
    const { id } = accountDetails;
    delete accountDetails.id;
		// Based on updated status value, reassign reducer users account storage list
		// If user is deleted, remove user
		// Else overWrite user object with the accountDetails object
    if (!accountDetails.status) {
    	users = users.filter(user => user._id !== id);
	    selectedUser = strictValidArrayWithLength(users.filter(user => user._id === id)) &&
		    users.filter(user => user._id === id)[0];
    } else {
      users = users.map((user) => {
        if (user._id === id) {
          Object.assign(user, accountDetails);
        }
        return user;
      });
      selectedUser = strictValidArrayWithLength(users.filter(user => user._id === id)) &&
	      users.filter(user => user._id === id)[0];
		}
		// Update user in database by calling put api
    await api.put(`/account/${id}`, { data: accountDetails });
		await dispatch(loadAccounts());
    await dispatch({
	    type: LOAD_ACCOUNTS,
			items: users
		});
		await dispatch({
			type: SELECT_USER,
			selectedUser: accountDetails.status ? selectedUser : {}
		});
		await dispatch({
			type: LOAD_SUCCESS,
			message: 'Updated Successfully'
		});
	  dispatch(internals.resetMessage());
  } catch (err) {
    // If an error occurs, set error field
    await dispatch({ 
			type: LOAD_FAIL, 
			error: (validObjectWithParameterKeys(err, ['message']) && typeCastToString(err.message)) || typeCastToString(err) 
		});
		dispatch(internals.resetMessage());
  }
};

/**
 * To update user account details
 * Access role allowed - user 
 * @param formData object
 */
export const updateUserProfile = formData => async (dispatch, getState, api) => {
	dispatch({ type: LOAD });
	try {
		// Fetch id & email from stored data in reducer
		const { id, email } = getState().get('auth').get('user');
		// If valid formData with 'profileDetails' key which is an object containing user profile values insert in database
		if (strictValidObjectWithKeys(formData) && strictValidObjectWithKeys(formData.profileDetails)) {
			await api.put(`/account/${id}`, { data: formData.profileDetails });
    }
		// Update password if password field is present in formData object
		if (strictValidObjectWithKeys(formData) && strictValidObjectWithKeys(formData.password)) {
			const updatePasswordObj = {
				email,
				currentPassword: formData.password.currentPassword,
				newPassword: formData.password.password
			};
			// Update user password with the help of email & current password
			await dispatch(updatePassword(updatePasswordObj));
		}
		await dispatch({ type: LOAD_SUCCESS, message: 'Updated Successfully' });
		dispatch(internals.resetMessage());
	} catch (err) {
		// If an error occurs, set error field
    await dispatch({ 
			type: LOAD_FAIL, 
			error: (validObjectWithParameterKeys(err, ['message']) && typeCastToString(err.message)) || typeCastToString(err) 
		});
		dispatch(internals.resetMessage());
	}
};

/**
 * To verify user invitation token
 * Access role allowed - user 
 * @param inviteToken jwt encoded user details object
 */
export const verifyInviteToken = inviteToken => async (dispatch, getState, api) => {
  dispatch({ type: VERIFY_TOKEN });
  try {
    let res = await api.post('/account/verifyInviteToken', { data: { inviteToken } });
    dispatch({ type: VERIFY_TOKEN_SUCCESS, res });
    return res;
  } catch (err) {
		// If an error occurs, set error field
    await dispatch({ 
			type: VERIFY_TOKEN_FAIL, 
			error: (validObjectWithParameterKeys(err, ['message']) && typeCastToString(err.message)) || typeCastToString(err) 
		});
		dispatch(internals.resetMessage());
  }
};

/**
 * To update user password
 * Access role allowed - user 
 * @param updateDetails object 
 * @param tokenPassedFlag boolean true or false depending on if token is passed in updateDetails 
 */
export const updatePassword = (updateDetails, tokenPassedFlag = false) => async (dispatch, getState, api) => {
	dispatch({ type: UPDATE_PASSWORD });
	// If current password is used use it to verify user
  try {
		const putUrl = tokenPassedFlag 
			? '/account/updatePasswordWithToken' 
			: '/account/updatePasswordWithoutToken';
    let res = await api.put(putUrl, { data: updateDetails });
    dispatch({ type: UPDATE_PASSWORD_SUCCESS });
    return res;
  } catch (err) {
		// If an error occurs, set error field
    await dispatch({ 
			type: UPDATE_PASSWORD_FAIL, 
			error: (validObjectWithParameterKeys(err, ['message']) && typeCastToString(err.message)) || typeCastToString(err) 
		});
	  dispatch(internals.resetMessage());
  }
};

/**
 * To update selected user in reducer
 * Access role allowed - admin
 * @param user object 
 */
export const selectUser = user => async (dispatch) => {
	await dispatch({ type: SELECT_USER, selectedUser: user });
};

/**
 * To flush reducer state
 * Access role allowed - admin 
 */
export const flush = () => async (dispatch) => {
  await dispatch({ type: FLUSH });
};

/**
 * To reset message fields in reducer
 */
internals.resetMessage = (defaultTimeout = DEFAULT_MILLISECONDS_TO_SHOW_MESSAGES) => {
	return dispatch => setTimeout(() => {
		dispatch({ type: RESET_MESSAGE });
	}, defaultTimeout || DEFAULT_MILLISECONDS_TO_SHOW_MESSAGES);
};

/**
 * For relational field data 
 * To get reducer values from key ending in 'types' if stored
 */
internals.getTypeArrayValues = (type, dataObj) => (dispatch, getState) => (
	validObjectWithParameterKeys(dataObj, [type]) &&
	strictValidArrayWithLength(dataObj[type]) &&
	dataObj[type].map((v, k) => Object.assign(
		{ checked: v },
		getState().get('account').get(`${type}s`)[k]
	))
) || null;

/**
 * For relational field data 
 * To add & remove values relational data fields in database & re assign in reducer
 */
internals.addAndDeleteMultipleTypes = (formTypeValuesList, type) => async (dispatch, getState, api) => {
	try {
	  const addList = [];
	  const deleteList = [];
	  const { id } = getState().get('auth').get('user');
		const typesList = getState().get('account').get(`${type}s`) || [];
		const isValidDataFlag = strictValidString(type) && strictValidArrayWithLength(typesList);
		if (isValidDataFlag) {
			const currentTypeValuesList = getState().get('account').get('relationalMappedData')[type] || [];
			const indexOfRelation = RELATIONAL_MAPPING_INFO_LIST.findIndex(r => r.formValuesKey === type);
			const relation = RELATIONAL_MAPPING_INFO_LIST[indexOfRelation];
			formTypeValuesList.forEach((formTypeValue, idx) => {
				const typeId = (strictValidObjectWithKeys(typesList[idx]) && typesList[idx].id) || -1;
				if (typeId >= -1) {
					if (formTypeValue && !currentTypeValuesList[idx]) {
						addList.push(typeId);
					} else if (!formTypeValue && currentTypeValuesList[idx]) {
						deleteList.push(typeId);
					}
				}
			});
			if (strictValidArrayWithLength(addList)) {
				const dataListOfObjects = addList.map(v => ({ userId: id, [relation.targetKey]: v }));
				await api.post(`/common/bulkInsert`, { data: { table: relation.secondaryTable, dataListOfObjects } });
			}
			if (strictValidArrayWithLength(deleteList)) {
				const whereObj = { userId: id, [relation.targetKey]: { $in: deleteList } };
				await api.post(`/common/bulkDelete`, { data: { table: relation.secondaryTable, whereObj } });
			}
			return true;
		}
	} catch (err) {
		return false;
	}
};

/**
 * For relational field data 
 * To fetch its value
 */
internals.formatRelationalMappedData = relationalMappedData => () => {
	let groupsKeyObject = {};
	let groupsValuesObject = {};
	if (strictValidArrayWithLength(relationalMappedData)) {
		relationalMappedData.forEach((v, k) => {
			const isValidEntryObjectFlag = validObjectWithParameterKeys(v, ['count', 'rows']) &&
				validObjectWithParameterKeys(
					RELATIONAL_MAPPING_INFO_LIST[k],
					['primaryTable', 'reduxStateKey', 'dataIncludeKey']
				);
			if (isValidEntryObjectFlag) {
				const { primaryTable, reduxStateKey, dataIncludeKey } = RELATIONAL_MAPPING_INFO_LIST[k];
				const uniqueValidIds = [...new Set(v
					.rows
					.filter((r, i) => validObjectWithParameterKeys(r, ['id', 'name']))
					.map(r => r.id)
				)];
				groupsKeyObject[primaryTable] = [];
				v.rows.forEach((r, i) => {
					if (uniqueValidIds.indexOf(r.id) > -1) {
						let toPushFlag = true;
						if (i && r.id === v.rows[i - 1].id) {
							toPushFlag = false;
						}
						if (toPushFlag) {
							const toPushObject = Object.assign({}, r);
							delete toPushObject[dataIncludeKey];
							groupsKeyObject[primaryTable].push(toPushObject);
						}
					}
				});
				groupsValuesObject[reduxStateKey] = [...new Set(v
					.rows
					.filter(r =>
						validObjectWithParameterKeys(r, ['id', dataIncludeKey]) &&
						validObjectWithParameterKeys(r[dataIncludeKey], ['id'])
					)
					.map(r => r[dataIncludeKey])
				)];
			}
		});
	}
	return Object.assign({}, groupsKeyObject, groupsValuesObject);
};