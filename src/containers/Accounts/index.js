import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, Grid, Header, Message, Confirm, Icon, Segment, List, Form, Loader } from  'semantic-ui-react';
import { Field, reduxForm } from 'redux-form/immutable';
import { DropDown } from '../../components/Form';
import { loadAccounts, saveAccount, updateAccount, selectUser } from '../../redux/modules/account';
import AccountModal  from '../../components/AccountModal';
import Pagination from '../../components/Pagination';
import {
  strictValidArray,
  strictValidArrayWithLength,
  validObjectWithParameterKeys,
  strictValidArrayWithMinLength,
  typeCastToKeyValueObject
} from '../../utils/commonutils';
import { STATUS_DROPDOWN_OPTIONS_OBJECT_LIST } from '../../utils/constants';
import AuthenticatedUser from '../../components/AuthenticatedUser';
import '../../style/css/style.css';

const TableRow = ({ row, editAccount, typeAction }) => {
  const rowBgColor = [];
  rowBgColor[1] = 'bg-success';
  rowBgColor[2] = 'bg-warning';
  rowBgColor[3] = 'bg-danger';

  return (
    <Table.Row className={ row.status ? rowBgColor[row.status] : 'bg-warning' }>
      <Table.Cell>{ row.firstName } { row.lastName }</Table.Cell>
      <Table.Cell>{ row.email } </Table.Cell>
      <Table.Cell>{ row.phone }</Table.Cell>
      <Table.Cell>
        <a onClick={ () => editAccount(row) } >  <Icon name='edit outline' size='small' /> </a>
        <a onClick={() => typeAction('delete', row)} > <Icon name='trash alternate outline' size='small' /> </a>
        <a onClick={() => typeAction('active', row)} > <Icon name='check circle outline' size='small' /></a>
        <a onClick={() => typeAction('denied', row)} > <Icon name='eye slash outline' size='small' /> </a>
      </Table.Cell>
    </Table.Row>
  );
};

@connect(state => ({
	user: state.get('auth').get('user'),
  items: state.get('account').get('items'),
	itemsFilters: typeCastToKeyValueObject(state.get('account').get('itemsFilters'), ['page']),
  itemsCount: state.get('account').get('itemsCount'),
  isLoad: state.get('account').get('isLoad'),
  message: state.get('account').get('message'),
  loadErr: state.get('auth').get('loadErr') || state.get('account').get('loadErr')
}))
@reduxForm({
  form: 'listAccountFiltersForm',
	enableReinitialize: true
})
export default class Accounts extends Component {
  static propTypes = {
	  user: PropTypes.object,
    dispatch: PropTypes.func,
    items: PropTypes.array,
    itemsFilters: PropTypes.object,
    itemsCount: PropTypes.number,
    isLoad: PropTypes.bool,
    message: PropTypes.string,
    loadErr: PropTypes.string
  };
  
  static defaultProps = {
    dispatch: null,
    items: PropTypes.object
  };
  
  state = {
    loading: true,
    selectedUser: null,
    openConfirmBox: false,
    type: null,
    showMessageFlag: true
  };
  
  componentDidMount = async () => {
    const { dispatch, itemsFilters } = this.props;
	  await dispatch(loadAccounts(itemsFilters));
	  this.setState({ loading: false });
  };
  
  handleConfirm = async () => {
    const { selectedUser, type } = this.state;
    const { dispatch } = this.props;
    let accountDetails = { id: selectedUser._id };
    if (type === 'delete') {
      accountDetails.isDeleted = true;
    } else if (type === 'active'){
      accountDetails.status = 1;
    } else if (type === 'denied') {
      accountDetails.status = 3;
    }
    this.setState({ loading: true });
    await dispatch(updateAccount(accountDetails, false));
	  this.setState({
      loading: false,
      openConfirmBox: false,
      selectedUser: null
	  });
  };
  
  editAccount = async row => {
    const { dispatch } = this.props;
	  this.setState({ loading: true });
    await dispatch(selectUser(row));
    this.setState({
      loading: false,
      selectedUser: row
    });
  };
  
  typeAction = (type, row) => this.setState({ openConfirmBox: true, type, selectedUser: row });
  
  account = async userData => {
    const { dispatch } = this.props;
    delete userData.events;
    Object.keys(userData)
          .filter(key => !userData[key])
          .forEach(key => delete userData[key]);
	  this.setState({ loading: true });
    let response = null;
    if (userData._id) {
      response = await dispatch(updateAccount(userData));
    } else {
      // Assign default values
      userData.role = 2;
      userData.status = 1;
      response = await dispatch(saveAccount(userData));
    }
	  this.setState({ loading: false });
	  return response;
  };
  
  handleSort = async sortCol => {
	  const { itemsFilters } = this.props;
	  const { dispatch } = this.props;
	  this.setState({ loading: true });
	  const initialColumnOrderList = validObjectWithParameterKeys(itemsFilters, ['order']) &&
      strictValidArrayWithLength(itemsFilters.order) && itemsFilters.order.filter(v => v[0] === sortCol);
	  const sortDir = strictValidArrayWithLength(initialColumnOrderList) &&
      strictValidArrayWithMinLength(initialColumnOrderList[0], 2) ? initialColumnOrderList[0][1] || 'ASC' : 'ASC';
	  const newSortDir = sortDir.toUpperCase() === 'ASC' ? 'DESC' : 'ASC';
	  const newOrderByList = [[sortCol, newSortDir]];
	  await dispatch(loadAccounts(Object.assign(itemsFilters, { order: newOrderByList })));
	  this.setState({ loading: false });
  };
  
  handleStatus = async (e, status) => {
    let { itemsFilters } = this.props;
    const { dispatch } = this.props;
	  this.setState({ loading: true });
	  itemsFilters.page = 1;
    await dispatch(loadAccounts(Object.assign(itemsFilters, { status })));
	  this.setState({ loading: false });
  };
	
	handleNavigatePage = async page => {
		const { itemsFilters } = this.props;
		const { dispatch } = this.props;
		this.setState({ loading: true });
		await dispatch(loadAccounts(Object.assign(itemsFilters, { page })));
		this.setState({ loading: false });
  };
	
	getSortClass = sortCol => {
	  let { itemsFilters } = this.props;
	  let sortClass = 'sortAsc';
	  let sortIconClass = 'down';
	  if (validObjectWithParameterKeys(itemsFilters, ['order'])) {
		  const colSortList = strictValidArrayWithLength(itemsFilters.order) &&
        itemsFilters.order.filter(v => v[0] === sortCol);
		  if (strictValidArrayWithLength(colSortList) && strictValidArrayWithMinLength(colSortList[0], 2)) {
			  sortClass = colSortList[0][1].toUpperCase() === 'ASC' ? 'active sortAsc' : 'active sortDesc';
			  sortIconClass = colSortList[0][1].toUpperCase() === 'ASC' ? 'down' : 'up';
		  }
    }
    return {
	    sortClass,
	    sortIconClass
    }
  };
	
  messageDismiss = () => this.setState({ showMessageFlag: false });
  
  closeConfirmBox = () => this.setState({ openConfirmBox: false, selectedUser: null });
  
  handleEditUserCancel = async () => {
  	const { dispatch } = this.props;
	  await dispatch(selectUser({}));
  	this.setState({ selectedUser: null });
  };
  
  render() {
    const { items, itemsFilters, itemsCount, isLoad, message, loadErr } = this.props;
    const { loading, selectedUser, showMessageFlag, openConfirmBox, type } = this.state;
	  return (
      <AuthenticatedUser>
			  {
				  message && showMessageFlag &&
          <Message onDismiss={this.messageDismiss}>
            <span style={{ color: 'green' }}>{ message }</span>
          </Message>
			  }
			  {
				  loadErr && showMessageFlag &&
          <Message onDismiss={this.messageDismiss}>
            <span style={{ color: 'red' }}>{ loadErr }</span>
          </Message>
			  }
	      {
		      (loading || isLoad) &&
          <Loader active inline='centered'>Loading...</Loader>
	      }
        {
          !loading && !isLoad &&
          <Grid>
            <div className="ui left floated column innerAdjust">
              <h3 className="mainHeading"> Accounts</h3>
            </div>
            <Grid.Row>
              <Grid.Column computer={12}>
                <List horizontal floated='right'>
                  <List.Item>
                    <span className="statusPending"/>
                    <List.Content floated='right'> Pending </List.Content>
                  </List.Item>
                  <List.Item>
                    <span className="statusDenied"/>
                    <List.Content floated='right'> Denied </List.Content>
                  </List.Item>
                  <List.Item>
                    <span className="statusActive"/>
                    <List.Content floated='right'> Active </List.Content>
                  </List.Item>
                  <List.Item>
                    <List.Content floated='right'>
                      <Form className="mt-10">
                        <Field
                          className="minWidth130"
                          name="status"
                          component={ DropDown }
                          options={ STATUS_DROPDOWN_OPTIONS_OBJECT_LIST }
                          inline={ true }
                          fluid={ true }
                          search={ true }
                          selectOnBlur={ true }
                          placeholder="Please select"
                          onChange={(e, v) => this.handleStatus(e, v)}
                        />
                      </Form>
                    </List.Content>
                  </List.Item>
                </List>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column computer={12}>
                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell className={`${this.getSortClass('firstName').sortClass}` }>
                        <a onClick={() => this.handleSort('firstName') }>Name
                          <i className={`sort amount ${this.getSortClass('firstName').sortIconClass} icon ml-05`}></i>
                        </a>
                      </Table.HeaderCell>
                      <Table.HeaderCell className={`${this.getSortClass('email').sortClass}` }>
                        <a onClick={() => this.handleSort('email') }>Email
                          <i className={`sort amount ${this.getSortClass('email').sortIconClass} icon ml-05`}></i>
                        </a>
                      </Table.HeaderCell>
                      <Table.HeaderCell className={`${this.getSortClass('phone').sortClass}` }>
                        <a onClick={() => this.handleSort('phone') }>Phone
                          <i className={`sort amount ${this.getSortClass('phone').sortIconClass} icon ml-05`}></i>
                        </a>
                      </Table.HeaderCell>
                      <Table.HeaderCell>Action</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
					          {
						          strictValidArrayWithLength(items) &&
						          items.map(user => (
                        <TableRow
                          key={user._id}
                          row={user}
                          editAccount={this.editAccount}
                          typeAction={this.typeAction}
                        />
                      ))
					          }
	                  {
		                  !strictValidArrayWithLength(items) &&
		                  <Table.Row>
			                  <Table.Cell colSpan="100%" style={{ color: 'red', textAlign: 'center' }}>
				                  No users found
			                  </Table.Cell>
		                  </Table.Row>
	                  }
                  </Table.Body>
                </Table>
			          {
				          strictValidArray(items) &&
                  <Pagination
                    totalEntries={itemsCount}
                    offset={itemsFilters.limit}
                    currentPage={itemsFilters.page}
                    navigate={page => this.handleNavigatePage(page)}
                  />
			          }
              </Grid.Column>
              <Grid.Column computer={4}>
                <Confirm
                  content={`Are you sure you want to ${type} this user ?`}
                  confirmButton="Confirm"
                  open={openConfirmBox}
                  onCancel={this.closeConfirmBox}
                  onConfirm={this.handleConfirm}
                />
                <Header as='h4' attached='top' className="Primary">
				          { validObjectWithParameterKeys(selectedUser, ['id']) ? 'Edit Profile' : 'Add New Profile' }
                </Header>
                <Segment attached>
                  <AccountModal
                    account={this.account}
                    selectedUser={selectedUser}
                    handleEditUserCancel={this.handleEditUserCancel}
                  />
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        }
      </AuthenticatedUser>
	  );
  }
}
