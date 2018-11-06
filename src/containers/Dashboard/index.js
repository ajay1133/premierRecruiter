import React, { Component } from 'react';
import MarkDown from 'markdown-it';
import Markup from 'react-html-markup';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, List, Loader, Modal, Icon } from 'semantic-ui-react';
import config from '../../config';
import { getHashParams } from '../../utils/commonutils';
import { bitBucketListing, bitBucketView } from '../../redux/modules/bitBucketRepo';

const { bitBucket } = config;

const md = MarkDown({
  html: false,
  linkify: true,
  typographer: true
});

class Dashboard extends Component {
  state = {
    loading: false,
    hideRepoListingAreaFlag: false,
    modalOpenFlag: false,
	  modalHeader: null,
    token: null
  };
  
  static propTypes = {
    dispatch: PropTypes.func,
    location: PropTypes.object,
    bitBucketList: PropTypes.array,
    bitBucketView: PropTypes.string
  };
  
  componentDidMount = () => {
    const { dispatch, location } = this.props;
    const params = getHashParams(location.hash);
    
    const validParamsFlag = params && Object.keys(params).length && params.access_token;
    
    if (validParamsFlag) {
      const token = params.access_token;
      
      this.setState({
        loading: true,
        token
      });
      
      dispatch(bitBucketListing({ token }))
        .then(() => this.setState({ loading: false }))
        .catch(() => this.setState({ loading: false }));
    }
  };
  
  bitBucketConnect = () => {
    window.location =
      `https://bitbucket.org/site/oauth2/authorize?client_id=${bitBucket.key}&response_type=token`;
  };
	
	hideRepoListingArea = () => {
	  const { hideRepoListingAreaFlag } = this.state;
	  
	  this.setState({
		  hideRepoListingAreaFlag: !hideRepoListingAreaFlag
    })
  };
  
  getMd = (content) => md.render(content);
  
  getBitBucketData = async (e, href, type, displayName) => {
    const { dispatch } = this.props;
    const { token } = this.state;
    
    const listData = Object.assign({}, {
      token,
      path: href.split('/src')[1]
    });
    
    this.setState({ loading: true });
    
    if (type === 'commit_directory') {
      await dispatch(bitBucketListing(listData));
    } else {
      await dispatch(bitBucketView(listData));
    }
    
    this.setState({
      loading: false,
      modalOpenFlag: type !== 'commit_directory',
      modalHeader: type !== 'commit_directory' ? displayName : null
    });
  };
  
  getLevelUp = (repo) => {
    let href_1 = '', href_2 = '';
    
    if (repo.path.split('/').length > 1) {
      href_2 = repo.path.split('/').slice(-4, -2)[0] || 'src';
      href_1 = repo.links.self.href.split(href_2)[0];
      
      return (
        <List.Icon
          size='large'
          name='reply'
          onClick={ (e) => this.getBitBucketData(e, (href_1+href_2), 'commit_directory') }
        />);
    }
  };
  
  modalClose = () => {
    const { modalOpenFlag } = this.state;
    
    this.setState({
      modalOpenFlag: !modalOpenFlag
    });
  };
  
  render () {
    const { user, isLoad, loadErr, bitBucketList, bitBucketView } = this.props;
	  const { loading, hideRepoListingAreaFlag, modalHeader, modalOpenFlag, token } = this.state;
    
    const loadingCompleteFlag = !isLoad && !loadErr;
    const validBitBucketListFlag = loadingCompleteFlag && bitBucketList && Array.isArray(bitBucketList);
    
    if (!user || (isLoad && loadErr)) {
      return (
        <div>
          {
            user && <span style={{ color: 'red' }}>An Error Occurred : { loadErr }</span>
          }
          {
            !user && <span style={{ color: 'red' }}>Session Expired</span>
          }
        </div>
      );
    }
    
    return (
      <div>
        {
          !token &&
          <Button
            className='ui facebook button hand-pointer'
            style={{ marginTop: '-10px' }}
            role='button'
            onClick={ () => this.bitBucketConnect() }
          >
            <i aria-hidden='true' className='bitbucket icon' />Fetch Data From BitBucket
          </Button>
        }
        
        {
          !token &&
          <div className="row" style={{ marginTop: '20px' }}>
            Click on the "Fetch Data From BitBucket" button above to get access from BitBucket where you will
            need to login to grant access to "your" BitBucket repository
          </div>
        }
        
        {
          token &&
          <div className="ui card fluid cardShadow">
            <div className="content pageMainTitle">
              <h4>
                { loadingCompleteFlag ? 'Listing' : 'Loading' } Files From BitBucket Repository
                <Button
                  className='float-right button hand-pointer'
                  style={{ float: 'right' }}
                  role='button'
                  onClick={ () => this.hideRepoListingArea() }
                >
		              { hideRepoListingAreaFlag ? 'Expand' : 'Collapse' }
                </Button>
              </h4>
              {
	              loadingCompleteFlag && !hideRepoListingAreaFlag &&
                <span>
                  Click on the name/icon to view the contents. Click on the back icon to go back.
                </span>
              }
            </div>
            
            {
	            validBitBucketListFlag && !!bitBucketList.length && !hideRepoListingAreaFlag &&
              <div className="content">
                <List>
                  <List.Item>
                    { this.getLevelUp(bitBucketList[0]) }
                  </List.Item>
                  <List.Item>
                    { <List.Icon size='large' name='folder open'/> }
                    <List.Content>
                      <List.Header>
                        { bitBucketList[0].path.split('/').slice(-2, -1)[0] || 'src' }
                      </List.Header>
                      <List.List>
                        {
                          bitBucketList.map((repo, idx) => {
                            return (
                              <List.Item
                                as='a'
                                key={idx}
                                onClick={ (e) => this.getBitBucketData(
                                  e,
                                  repo.links.self.href,
                                  repo.type,
                                  repo.path.split('/').pop()
                                ) }
                              >
                                <List.Icon
                                  size='large'
                                  verticalAlign='middle'
                                  name={ (repo.type === 'commit_directory') ? 'folder' : 'file' }
                                />
                                <List.Content>
                                  <List.Header>
                                    { repo.path.split('/').pop() }
                                  </List.Header>
                                </List.Content>
                              </List.Item>
                            );
                          })
                        }
                      </List.List>
                    </List.Content>
                  </List.Item>
                </List>
              </div>
            }
            
            {
	            loadingCompleteFlag && !bitBucketList.length && !hideRepoListingAreaFlag &&
              <div className="content">
                No files found
              </div>
            }
            
            {
	            !loadingCompleteFlag && !hideRepoListingAreaFlag &&
              <div className="content">
                <Loader active inline='centered'>Loading</Loader>
              </div>
            }
          </div>
        }
  
        {
	        !loading && loadingCompleteFlag && modalOpenFlag &&
          <Modal
            open={ true }
            dimmer="blurring"
            closeOnEscape={ true }
            closeOnDimmerClick={ true }
            onClose={ () => this.modalClose() }
            size="large"
          >
            <Modal.Header>
              {
                <span><Icon name='file' size='large' /><span style={{ marginLeft: '5px' }}>{ modalHeader }</span></span>
              }
            </Modal.Header>
            <Modal.Content>
              {
                bitBucketView &&
                <Markup htmlString= { this.getMd(bitBucketView) } />
              }
	            {
		            !bitBucketView &&
                <span style={{ color: 'red' }}>Error fetching content</span>
	            }
            </Modal.Content>
          </Modal>
        }
      </div>
    );
  }
}

export default connect(state => ({
  user: state.get('auth').get('user'),
  isLoad: state.get('bitBucketRepo').get('isLoad'),
  loadErr: state.get('bitBucketRepo').get('loadErr'),
  bitBucketList: state.get('bitBucketRepo').get('bitBucketList'),
  bitBucketView: state.get('bitBucketRepo').get('bitBucketView')
}))(Dashboard);