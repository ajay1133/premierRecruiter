import React from 'react';
import PropTypes from 'prop-types';
import { ConnectedRouter } from 'connected-react-router/immutable';
import { Route, Switch } from 'react-router';
import Loadable from 'react-loadable';
import Loading from  '../components/Loading';
import { validObjectWithParameterKeys } from '../utils/commonutils';

const Home = Loadable({
    loader: () => import('../containers/Home'),
    loading: Loading,
});

const TermsOfUse = Loadable({
	loader: () => import('../containers/TermsOfUse'),
	loading: Loading,
});

const PrivacyPolicy = Loadable({
	loader: () => import('../containers/PrivacyPolicy'),
	loading: Loading,
});

const Accounts = Loadable({
    loader: () => import('../containers/Accounts'),
    loading: Loading,
});

const Profile = Loadable({
    loader: () => import('../containers/Profile'),
    loading: Loading,
});

const ContactUs = Loadable({
    loader: () => import('../containers/ContactUs'),
    loading: Loading,
});

const Confirmation = Loadable({
    loader: () => import('../containers/Confirmation'),
    loading: Loading,
});

class MainRoute extends React.Component {
  render () {
    const { history, user } = this.props;
    const isUserLoggedInFlag = validObjectWithParameterKeys(user, ['_id', 'role']);
    const switchRoutesACL = (
        <Switch>
            {
                !isUserLoggedInFlag &&
                <Route path="/terms-of-use" component={TermsOfUse} />
            }
            {
                !isUserLoggedInFlag &&
                <Route path="/privacy-policy" component={PrivacyPolicy} />
            }
            {
                !isUserLoggedInFlag &&
                <Route path="/accept/invitation/:inviteToken" component={Confirmation} />
            }
            {
                !isUserLoggedInFlag &&
                <Route path="/" component={Home} />
            }
            {
                isUserLoggedInFlag && user.role === 1 &&
                <Route path="/accounts" component={Accounts} />
            }
            {
                isUserLoggedInFlag && user.role === 1 &&
                <Route path="/contactUs" component={ContactUs} />
            }
            {
                isUserLoggedInFlag && user.role === 1 &&
                <Route path="/" component={Accounts} />
            }
            {
                isUserLoggedInFlag && user.role !== 1 &&
                <Route path="/" component={Profile} />
            }
        </Switch>
    );
    return (
      <ConnectedRouter history={ history }>
        <div>
          { switchRoutesACL }
        </div>
      </ConnectedRouter>
    );
  }
}

export default MainRoute;

MainRoute.propTypes = {
  user: PropTypes.object,
  history: PropTypes.object
};
