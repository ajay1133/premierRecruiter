import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Menu, Icon } from 'semantic-ui-react';
import { logout, load } from '../../redux/modules/auth';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { strictValidObjectWithKeys, validObjectWithParameterKeys } from '../../utils/commonutils';

class NavBar extends Component {
  static propTypes = {
    user: PropTypes.object,
    dispatch: PropTypes.func
  };
  
  constructor(props) {
    super(props);
    this.logOut = this.logOut.bind(this);
  };
  
  componentWillMount() {
    const { dispatch } = this.props;
    dispatch(load());
  };
  
  logOut = () => {
    const { dispatch } =  this.props;
    dispatch(logout());
  };
  
  loadRoute = (route) => {
		const { dispatch } =  this.props;
		if (route) {
		  dispatch(push(route));
		  return;
		}
		dispatch(push('/'));
	};
  
  render() {
    const { user, isShow, location } = this.props;
	  const validUserNameFlag = validObjectWithParameterKeys(user, ['firstName', 'lastName']) && (!!user.firstName ||
      !!user.lastName);
	  const currentLocation = location && strictValidObjectWithKeys(location.toJSON()) && location.toJSON().pathname;
	  if (!(validObjectWithParameterKeys(user, ['_id', 'role']) && isShow)) {
	    return null;
    }
	  return (
      <div className="topNavbar">
        <div className="col-8">
          <div className="ui right floated column">
            <Menu borderless>
						  {
							  user.role === 1 &&
                <Menu.Item active={ currentLocation === '/accounts' } onClick={ () => this.loadRoute('/accounts') }>
                  Accounts
                </Menu.Item>
						  }
						  {
							  user.role === 1 &&
                <Menu.Item active={ currentLocation === '/contactUs' } onClick={ () => this.loadRoute('/contactUs') }>
                  ContactUs
                </Menu.Item>
						  }
              <Menu.Menu position='right'>
                <Menu.Item onClick={ () => this.loadRoute() }>
                  <i className="user icon mr-10" />
                  { (validUserNameFlag && (user.firstName + ' ' + user.lastName)) || user.email }
                </Menu.Item>
                <Menu.Item>
                  <a onClick={this.logOut}>
                    <Icon link name="sign out" />
                  </a>
                </Menu.Item>
              </Menu.Menu>
            </Menu>
          </div>
        </div>
      </div>
	  );
  }
}

function mapStateToProps(state) {
  return {
    user: state.get('auth').get('user'),
	  location: state.get('router').get('location')
  };
}

export default connect(mapStateToProps)(NavBar)