import Immutable from 'immutable';
import {
	strictValidObjectWithKeys,
	typeCastToString,
  strictValidArrayWithLength,
  strictValidString,
	validObjectWithParameterKeys,
	strictValidArray,
	strictValidObject,
  strictValidArrayWithMinLength,
  typeCastToKeyValueObject
} from '../../utils/commonutils';
import {
	DEFAULT_MILLISECONDS_TO_SHOW_MESSAGES,
  DEFAULT_CONTACT_LIST_FILTERS
} from '../../utils/constants';

// Action creators
// Loading
const LOAD = 'contact/LOAD';
const LOAD_SUCCESS = 'contact/LOAD_SUCCESS';
const LOAD_FAIL = 'contact/LOAD_FAIL';
// Contacts
const LOAD_CONTACTS = 'contact/LOAD_CONTACTS';
// Reset Reducer
const FLUSH = 'contact/FLUSH';
const RESET_MESSAGE = 'contact/RESET_MESSAGE';

const initialState = Immutable.fromJS({
  isLoad: false,
  loadErr: null,
  message: null,
  items: [],
  itemsCount: 0,
	itemsFilters: DEFAULT_CONTACT_LIST_FILTERS,
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
    // Contacts
    case LOAD_CONTACTS:
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
      DEFAULT_CONTACT_LIST_FILTERS
    );
    // Reset Reducer
	  case RESET_MESSAGE:
		  return state
      .set('message', null)
      .set('loadErr', null);
	  case FLUSH: {
		  return initialState;
    }
    // Default case
    default:
      return state;
  }
}

/**
 * To load contacts list
 * Access role allowed - admin
 * @param filters object
 */
export const getContactList = filters => async (dispatch, getState, api) => {
  dispatch({ type: LOAD });
  try {
    // Check if valid filters
  	const itemsFilters = (strictValidObjectWithKeys(filters) && filters) ||
			getState().get('contact').get('itemsFilters');
		// If 'order' key is present in filters	
  	if (strictValidArrayWithLength(itemsFilters.order)) {
      const sortByList = itemsFilters.order.filter(v => strictValidArrayWithMinLength(v, 2)).map(v => v[0]);
      const orderList = itemsFilters.order.filter(v => strictValidArrayWithMinLength(v, 2)).map(v => v[1]);
      itemsFilters.sortBy = JSON.stringify(sortByList);
  	  itemsFilters.order = JSON.stringify(orderList);
		}
		// Get users list from get api
    const res = await api.get('/common/getTableData', { params: Object.assign({}, { table: 'contactUs' }, itemsFilters) });
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
			dispatch({ type: LOAD_SUCCESS })
			dispatch({
				type: LOAD_CONTACTS,
			  items: res.rows,
			  itemsCount: res.count,
			  itemsFilters
		  });
	  }
  } catch (err) {
    // If an error occurs, set error field
    dispatch({ 
			type: LOAD_FAIL, 
			error: (validObjectWithParameterKeys(err, ['message']) && typeCastToString(err.message)) || typeCastToString(err) 
		});
	  dispatch(internals.resetMessage());
  }
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