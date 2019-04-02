import React, { Component } from 'react';
import { Redirect } from 'react-router';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class AuthenticatedUser extends Component {
  static propTypes = {
    location: PropTypes.object,
    children: PropTypes.node,
    user: PropTypes.object
  }
  static defaultProps = {
    location: {},
    children: null,
    user: {}
  }
  render() {    
    const { children, location, user } = this.props;
    if (user && user._id) {
        return children;
    } else {
        return <Redirect to={{
          pathname: '/',
          state: { from: location }
        }} />
    }
  }
}
export default connect(state => ({
  user: state.get('auth').get('user')
}))(AuthenticatedUser);
