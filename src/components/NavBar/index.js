import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown } from 'semantic-ui-react';
import { logout, load } from '../../redux/modules/auth';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { strictValidObjectWithKeys, validObjectWithParameterKeys } from '../../utils/commonutils';

class NavBar extends Component {
  state = { activeItem: 'dashboard' };
  
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
		dispatch(push(route));
	};
	
  render() {
    const { user, isShow, location } = this.props;
    
	  const validUserNameFlag = validObjectWithParameterKeys(user, ['firstName', 'lastName']) && !!user.firstName &&
      !!user.lastName;
	  const currentLocation = location && strictValidObjectWithKeys(location.toJSON()) && location.toJSON().pathname;
	  
	  if (!(validObjectWithParameterKeys(user, ['id']) && isShow)) {
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
                <Menu.Item active={ currentLocation === '/dashboard' } onClick={ () => this.loadRoute('/dashboard') }>
                  Dashboard
                </Menu.Item>
						  }
              <Menu.Menu position='right'>
                <Dropdown item text= { (validUserNameFlag && (user.firstName + ' ' + user.lastName)) || user.email }>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={this.logOut}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
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