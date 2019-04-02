import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import queryString from 'querystring';
import { Field, reduxForm, formValueSelector, SubmissionError } from 'redux-form/immutable';
import { Grid, Message, Loader, Header, Button, Form, GridColumn } from  'semantic-ui-react';
import { TextBox, TextArea, CheckBox, DropDown } from '../../components/Form';
import { required, email, normalizePhone, url, passwordValidator, isValidZip } from '../../utils/validations';
import {
	strictValidObjectWithKeys,
	typeCastToString,
	strictValidArrayWithLength,
	validObjectWithParameterKeys,
	getOptionsListFromArray,
	typeCastToKeyValueObject
} from '../../utils/commonutils';
import {
	DEFAULT_ACTIVE_TAB_INDEX,
	STATES_LIST,
	USER_PROFILE_TABS,
	RELATIONAL_MAPPING_INFO_LIST
} from '../../utils/constants';
import { verifyUser } from '../../redux/modules/auth';
import { updateUserProfile } from '../../redux/modules/account';
import AuthenticatedUser from '../../components/AuthenticatedUser';
import _ from 'lodash';
import '../../style/css/style.css';

const selector = formValueSelector('profileForm');

@connect(state => ({
  initialValues: Object.assign(
  	{},
	  typeCastToKeyValueObject(state.get('auth').get('user'), ['id']),
	  state.get('account').get('relationalMappedData') || {}
  ),
	user: state.get('auth').get('user'),
	isLoad: state.get('auth').get('isLoad'),
	message: state.get('account').get('message'),
	loadErr: state.get('auth').get('loadErr') || state.get('account').get('loadErr'),
	currentPassword: selector(state, 'currentPassword'),
	password: selector(state, 'password'),
	confirmPassword: selector(state, 'confirmPassword')
}))
@reduxForm({
	form: 'profileForm',
	enableReinitialize: true
})
export default class Profile extends Component {
	static propTypes = {
		dispatch: PropTypes.func,
		handleSubmit: PropTypes.func,
		initialValues: PropTypes.object,
		user: PropTypes.object,
		isLoad: PropTypes.bool,
		message: PropTypes.string,
		loadErr: PropTypes.string,
		error: PropTypes.string,
		currentPassword: PropTypes.string,
		password: PropTypes.string,
		confirmPassword: PropTypes.string
	};
	
	static defaultProps = {
		dispatch: null,
		handleSubmit: null,
	};
	
	state = {
		loading: true,
		showMessageFlag: true,
		activeTabIndex: DEFAULT_ACTIVE_TAB_INDEX,
		serviceTypesFieldArray: [],
		serviceErrorStr: null
	};
	
	componentDidMount = async () => {
		const { location } = this.props;
		const { q } = (validObjectWithParameterKeys(location, ['search']) &&
			queryString.parse(location.search.substring(1))) || {};
		this.setState({
			loading: false,
			activeTabIndex: this.getActiveTabIndex(q)
		});
	};
	
	shouldComponentUpdate = async (nextProps) => {
		const { location } = nextProps;
		const { activeTabIndex } = this.state;
		const { q } = (validObjectWithParameterKeys(location, ['search']) &&
			queryString.parse(location.search.substring(1))) || {};
		if (this.getActiveTabIndex(q) !== activeTabIndex) {
			this.setState({ activeTabIndex: this.getActiveTabIndex(q) });
		}
	};
	
	getActiveTabIndex = q => {
		const qIndex = USER_PROFILE_TABS.findIndex(v => strictValidObjectWithKeys(v, ['tabName']) && v.tabName === q);
		return qIndex > -1 ? qIndex : DEFAULT_ACTIVE_TAB_INDEX;
	};
	
	messageDismiss = () => this.setState({ showMessageFlag: false });
	
	getPersonalInfoSection = () => {
		return (
		  <Grid>
			  <Grid.Row>
				  <Grid.Column computer="10">
					  <Header size='medium'>Personal Info</Header>
					  <Grid>
						  <Grid.Row columns={2}>
							  <Grid.Column>
								  <Field
									  name="title"
									  placeholder="Title"
									  component={TextBox}
								  />
							  </Grid.Column>
							  <Grid.Column>
								  <Field
									  name="firstName"
									  placeholder="First Name"
									  component={TextBox}
									  validate={required}
								  />
							  </Grid.Column>
						  </Grid.Row>
						  <Grid.Row columns={2}>
							  <Grid.Column>
								  <Field
									  name="lastName"
									  placeholder="Last Name"
									  component={TextBox}
								  />
							  </Grid.Column>
							  <Grid.Column>
								  <Field
									  name="email"
									  placeholder="Email"
									  component={TextBox}
									  validate={email}
								    readOnly
								  />
							  </Grid.Column>
						  </Grid.Row>
						  <Grid.Row >
							  <Grid.Column computer="8">
								  <Field
									  name="address"
									  placeholder="Street Address"
									  component={TextBox}
								  />
							  </Grid.Column>
							  <Grid.Column computer="8">
								  <Field
									  name="city"
									  placeholder="City"
									  component={TextBox}
								  />
							  </Grid.Column>
						  </Grid.Row>
						  <Grid.Row >
							  <Grid.Column computer="8">
								  <Field
									  search
									  fluid
									  multiple={ false }
									  selection
									  selectOnBlur={ true }
									  noResultsMessage="No results found"
									  name="state"
									  placeholder="State"
									  options={ getOptionsListFromArray(STATES_LIST) }
									  component={DropDown}
								  />
							  </Grid.Column>
							  <Grid.Column computer="8">
								  <Field
									  name="zip"
									  placeholder="Zip"
									  component={TextBox}
									  validate={isValidZip}
								  />
							  </Grid.Column>
						  </Grid.Row>
						  <Grid.Row >
							  <Grid.Column computer="8">
								  <Field
									  name="phone"
									  placeholder="Phone Number"
									  component={TextBox}
									  normalize={ normalizePhone }
								  />
							  </Grid.Column>
							  <Grid.Column computer="8">
								  <Field
									  name="website"
									  placeholder="Website Url"
									  component={TextBox}
									  validate={url}
								  />
							  </Grid.Column>
						  </Grid.Row>
					  </Grid>
				  </Grid.Column>
			  </Grid.Row>
		  </Grid>
		);
	};
	
	getRelationalDataSection = (relationDataListIndex) => {
		const userTabInfoObject = (USER_PROFILE_TABS
			.find(v =>
				validObjectWithParameterKeys(v, ['tabName', 'relationalMappingInfoListIndex']) &&
				v.relationalMappingInfoListIndex === relationDataListIndex
			)) || {};
		const relationalDataObject = (
				strictValidArrayWithLength(RELATIONAL_MAPPING_INFO_LIST) &&
				relationDataListIndex in RELATIONAL_MAPPING_INFO_LIST &&
				validObjectWithParameterKeys(
					RELATIONAL_MAPPING_INFO_LIST[relationDataListIndex],
					['primaryTable', 'formValuesKey']
				) &&
				RELATIONAL_MAPPING_INFO_LIST[relationDataListIndex]
			) || {};
		
		return (
			<Grid>
				<Grid.Column computer={ relationalDataObject.computerWidth || 10 }>
					<Header size='medium'>{ userTabInfoObject.tabName || '' }</Header>
					<Grid.Row celled="internally">
						<Grid.Column width={16}>
							<Grid columns={ relationalDataObject.gridColumns || 3 }>
								<Grid.Row className="newServices">
									{
										this.props[relationalDataObject.primaryTable].map((type, idx) => (
											<Grid.Column key={idx}>
												<Field
													name={ `${relationalDataObject.formValuesKey}[${idx}]` }
													component={CheckBox}
													label={ type.name }
												/>
											</Grid.Column>
										))
									}
								</Grid.Row>
							</Grid>
						</Grid.Column>
					</Grid.Row>
				</Grid.Column>
			</Grid>
		);
	};
	
	renderTabs = () => {
		const { handleSubmit } = this.props;
  	const { activeTabIndex } = this.state;
	  
  	const descContent = (
			<Grid>
				<Grid.Row >
					<Grid.Column computer="10">
						<Header size='medium'>Description About me</Header>
						<Field
							name="description"
							placeholder="Description"
							component={TextArea}
							autoHeight
						/>
					</Grid.Column>
				</Grid.Row>
			</Grid>
		);
  
		const showPane = (activeIndex) => {
			const { currentPassword, password, confirmPassword } = this.props;
			let contentSection = <div></div>;
			let showSubmitButtonFlag = true;
			
			switch (activeIndex) {
				case 0:
					const attemptToChangePasswordFlag = currentPassword || password || confirmPassword;
					contentSection = (
						<div className="editContent">
							<div>{ this.getPersonalInfoSection() }</div>
							<div className="mt-20">{ descContent }</div>
							<div className="mt-20">
								<Grid>
									<Grid.Column computer="10">
										<Header size='medium'>Change Password</Header>
										<Grid>
											<Grid.Row columns={1} className="serviceListing">
												<Grid.Column>
													<Field
														name="currentPassword"
														placeholder="Verify Your Current Password"
														type="password"
														component={TextBox}
													/>
												</Grid.Column>
											</Grid.Row>
											{
												attemptToChangePasswordFlag &&
												<Grid.Row columns={2} className="serviceListing">
													<Grid.Column>
														<Field
															name="password"
															placeholder="Enter New Password"
															type="password"
															component={TextBox}
															validate={passwordValidator}
														/>
													</Grid.Column>
													<Grid.Column>
														<Field
															name="confirmPassword"
															placeholder="Confirm New Password"
															type="password"
															component={TextBox}
															validate={required}
														/>
													</Grid.Column>
												</Grid.Row>
											}
											{
												!attemptToChangePasswordFlag &&
												<Grid.Row columns={2} className="serviceListing">
													<Grid.Column>
														<Field
															name="password"
															placeholder="Enter New Password"
															type="password"
															component={TextBox}
														/>
													</Grid.Column>
													<Grid.Column>
														<Field
															name="confirmPassword"
															placeholder="Confirm New Password"
															type="password"
															component={TextBox}
														/>
													</Grid.Column>
												</Grid.Row>
											}
										</Grid>
									</Grid.Column>
								</Grid>
							</div>
						</div>
					);
					break;
			}
			
			return (
				<Form onSubmit={ handleSubmit(this.handleSubmit) }>
					{ contentSection }
					{
						showSubmitButtonFlag &&
						<Button type="submit" primary className='updated'>Save Changes</Button>
					}
				</Form>
			);
		};
		
		return (
			showPane(activeTabIndex)
		);
	};

  handleSubmit = async(data) => {
		const { dispatch, user } = this.props;
	  const { activeTabIndex } = this.state;
		this.props.change('_error', null);
		const dataObj = (strictValidObjectWithKeys(data.toJSON()) && data.toJSON()) || {};
			
	  try {
		  if (strictValidObjectWithKeys(dataObj)) {
			  this.setState({ loading: true });
			  let formData = {};
		
			  /*
			  ** formData is the final object passed to reducer
			  ** Information that should update 'users' table should go in profileDetails
			  ** Information related to passwords should go into password
			  ** Other information should go into otherDetails
			  */
		    if (activeTabIndex === 0) {
		    	const attemptToChangePassword = !!dataObj.currentPassword || !!dataObj.password || !!dataObj.confirmPassword;
			    if (attemptToChangePassword) {
				    const validNewPasswordFlag = dataObj.password === dataObj.confirmPassword &&
					    !passwordValidator(dataObj.password);
				    const userVerificationData = await dispatch(verifyUser(user.email, dataObj.currentPassword));
				    const isUserVerifiedFlag = validObjectWithParameterKeys(userVerificationData, ['user']) &&
					    validObjectWithParameterKeys(userVerificationData.user, ['_id']) &&
					    userVerificationData.user._id === user._id;
				    if (!validNewPasswordFlag || !isUserVerifiedFlag) {
				    	throw new SubmissionError({
						    _error: !validNewPasswordFlag
							    ? passwordValidator(dataObj.password) || 'Password & Confirm Password do not match'
							    : 'User verification failed due to invalid password'
					    });
				    }
			    }
			    formData = {
				    profileDetails: _.pick(dataObj, USER_PROFILE_TABS[activeTabIndex].associatedFormKeys)
			    };
			    if (attemptToChangePassword) {
			    	formData.password = _.pick(dataObj, ['currentPassword', 'password', 'confirmPassword'])
			    }
			  }
			  
			  this.setState({ loading: true });
			  await dispatch(updateUserProfile(formData));
			  if (activeTabIndex === 2) {
				  this.props.change('currentPassword', '');
				  this.props.change('password', '');
				  this.props.change('confirmPassword', '');
			  }
			  this.setState({
				  loading: false,
				  uploadProfileImageName: null
			  });
		  } else {
			  throw new SubmissionError({ _error: 'Invalid data object' });
		  }
	  } catch (e) {
		  this.setState({
			  loading: false
		  });
		  if (activeTabIndex === 2) {
			  this.props.change('currentPassword', '');
			  this.props.change('password', '');
			  this.props.change('confirmPassword', '');
		  }
		  throw new SubmissionError({
			  _error: validObjectWithParameterKeys(e, ['errors']) && validObjectWithParameterKeys(e.errors, ['_error'])
				  ? typeCastToString(e.errors._error)
				  : typeCastToString(e) || 'Error updating profile'
		  });
	  }
  };
	
	render() {
    const { isLoad, loadErr, message, error } = this.props;
		const {	loading, showMessageFlag } = this.state;
		return (
			<AuthenticatedUser>
				{
	        message && showMessageFlag &&
	        <Message onDismiss={this.messageDismiss}>
            <span style={{ color: 'green' }}>{ message }</span>
	        </Message>
				}
				{
	        (loadErr || error) && showMessageFlag &&
	        <Message onDismiss={this.messageDismiss}>
		        <span style={{ color: 'red' }}>{ loadErr || typeCastToString(error) }</span>
	        </Message>
				}
				<Grid>
					<Grid.Row>
						<Grid.Column width={1}>
						</Grid.Column>
						<Grid.Column width={14}>
              { 
								(isLoad || loading) && 
								<Loader active inline='centered'>Loading...</Loader> 
							}
              { 
								!isLoad && !loading && 
								this.renderTabs() 
							}
						</Grid.Column>
					</Grid.Row>
				</Grid>
			</AuthenticatedUser>
		);
	}
}
