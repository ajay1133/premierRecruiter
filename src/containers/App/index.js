import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Grid, Segment, Sidebar } from 'semantic-ui-react';
import { connect } from 'react-redux';
import NavBar from '../../components/NavBar';
import VerticalSidebar from '../../components/VerticalSidebar';
import MainRoute from '../../routes';
import { validObjectWithParameterKeys } from '../../utils/commonutils';
import 'semantic-ui-css/semantic.css';
import '../../style/css/style.css';

class App extends Component {
  state = {
    animation: 'push',
    direction: 'left',
    dimmed: false,
    visible: false
  };
  
  handleAnimationChange = animation => () => this.setState({ animation, visible: !this.state.visible });
  
  render () {
    const { history, isShow = true, user } = this.props;
    const { animation, dimmed, direction, visible } = this.state;
    const isValidUserFlag = validObjectWithParameterKeys(user, ['_id', 'role']);
    return (
      <div className="full-height">
        <Button className="hide" onClick={this.handleAnimationChange('push')}>Push</Button>
        <Sidebar.Pushable as={Segment}>
          {
	          isValidUserFlag &&
            <VerticalSidebar
              animation={animation}
              direction={direction}
              visible={visible}
            />
          }
          <Sidebar.Pusher dimmed={dimmed && visible} >
            <Segment basic>
              {
                isShow &&
                <Grid className="innerData">
                  <Grid.Row>
                    <Grid.Column width={16} className="mainContent">
                      <NavBar isShow={isShow}/>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              }
              <MainRoute history={ history } user={ user } />
            </Segment>
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </div>
    );
  }
}

App.propTypes = {
  history: PropTypes.object,
  user: PropTypes.object
};

export default connect(state => ({
  user: state.get('auth').get('user')
}))(App);
