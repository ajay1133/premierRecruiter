import React, { Component } from 'react';
import MarkDown from 'markdown-it';
import TurnDown from 'turndown';
import Markup from 'react-html-markup';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form/immutable';
import PropTypes from 'prop-types';
import { Button, List, Loader, Modal, Icon, Message } from 'semantic-ui-react';
import config from '../../config';
import AddFile from '../../components/File/AddFile';
import EditFile from '../../components/File/EditFile';
import { bitBucketListing, bitBucketView, updateBitBucketFile } from '../../redux/modules/bitBucketRepo';
import { getHashParams, strictValidObjectWithKeys } from '../../utils/commonutils';

const { bitBucket } = config;

const md = MarkDown({
  html: false,
  linkify: true,
  typographer: true
});

@connect(state => ({
	initialValues: state.get('bitBucketRepo').get('setFileFormInitialValues'),
	user: state.get('auth').get('user'),
  message: state.get('bitBucketRepo').get('message'),
  isLoad: state.get('bitBucketRepo').get('isLoad'),
  loadErr: state.get('bitBucketRepo').get('loadErr'),
	accessToken: state.get('bitBucketRepo').get('accessToken'),
  bitBucketList: state.get('bitBucketRepo').get('bitBucketList')
}))
@reduxForm({
  form: 'setFileForm',
  enableReinitialize: true
})
export default class Dashboard extends Component {
  state = {
    loading: true,
    hideRepoListingAreaFlag: false,
    modalOpenFlag: false,
    openRepoFile: false,
    fileName: null,
    fileContent: null,
    href: null,
    repoPath: null,
    showMessageFlag: true
  };
  
  static propTypes = {
    dispatch: PropTypes.func,
    handleSubmit: PropTypes.func,
    user: PropTypes.object,
    message: PropTypes.string,
    isLoad: PropTypes.bool,
    loadErr: PropTypes.string,
    location: PropTypes.object,
	  accessToken: PropTypes.string,
    bitBucketList: PropTypes.array
  };
	
	constructor(props) {
		super(props);
		
		this.saveAccount = this.getBitBucketData.bind(this);
	};
	
  componentDidMount = () => {
    const { dispatch, location, history } = this.props;
    const params = getHashParams(location.hash);
	
	  const validParamsFlag = strictValidObjectWithKeys(params) && params.access_token;
    
    if (validParamsFlag) {
      history.replace('/dashboard');
	
	    this.fetchRootDirectoryDataFromBitBucket(params.access_token)
        .then(() => this.setState({ loading: false }))
        .catch(() => this.setState({ loading: false }));
    }
  };
  
  fetchRootDirectoryDataFromBitBucket = (accessToken) => {
  	const { dispatch } = this.props;
  	
    return dispatch(bitBucketListing({ accessToken }))
	    .then((res) => this.fetchDirectory(accessToken, res, 1))
	    .then((res) => this.fetchDirectory(accessToken, res, 0))
  };
  
  bitBucketConnect = () => {
    window.location =
      `https://bitbucket.org/site/oauth2/authorize?client_id=${bitBucket.key}&response_type=token`;
  };
  
  fetchDirectory = (accessToken, directory, dirPathIndex) => {
  	const { dispatch } = this.props;
  	
	  const dirToFetch = (directory && Array.isArray(directory) && directory.length > 1 && directory[dirPathIndex]) || {};
	
	  const pathArr = (dirToFetch && dirToFetch.links &&
		  dirToFetch.links.self && dirToFetch.links.self.href &&
		  dirToFetch.links.self.href.split('/src')) || [];
	
	  return dispatch(bitBucketListing({ accessToken, path: pathArr[1] }));
  };
  
  hideRepoListingArea = () => {
    const { hideRepoListingAreaFlag } = this.state;
    
    this.setState({
      hideRepoListingAreaFlag: !hideRepoListingAreaFlag
    })
  };
  
  getMd = (content) => md.render(content);
  
  getBitBucketData = async (e, href, type, displayName, repoPath) => {
    const { dispatch, accessToken } = this.props;
    
    const params = Object.assign({}, {
      accessToken,
      path: href.split('/src')[1]
    });
    
    this.setState({ loading: true });
    
    let res = null;
    const isLoadingDirectoryFlag = type === 'commit_directory';
    
    if (isLoadingDirectoryFlag) {
      res = await dispatch(bitBucketListing(params));
    } else {
	    res = await dispatch(bitBucketView(params));
    }
    
    this.setState({
      loading: false,
      modalOpenFlag: !isLoadingDirectoryFlag,
      fileName: !isLoadingDirectoryFlag ? displayName : null,
      fileContent: !isLoadingDirectoryFlag && res.data ? res.data : null,
      href,
      repoPath
    });
  };
  
  getParentDir = (repo) => {
    let href_1 = '', href_2 = '';
    
    if (repo.path.split('/').length > 1) {
      href_2 = repo.path.split('/').slice(-4, -2)[0] || 'src';
      href_1 = repo.links.self.href.split(href_2)[0];
      
      return (
        <List.Icon
          size='large'
          name='reply'
          onClick={ (e) => this.getBitBucketData(e, (href_1 + href_2), 'commit_directory', repo.path) }
        />
      );
    }
  };
  
  setFile = values => {
    const { dispatch, accessToken } = this.props;
    const { href, repoPath } = this.state;
    
    const turnDown = new TurnDown();
    
    const formValues = values.toJSON();
    
    const { fileName = '' } = formValues;
    
    const dataObject = {
      accessToken,
      path: fileName && repoPath ? repoPath + '/' + fileName : (fileName && !repoPath ? fileName : repoPath),
      content: this.compileFormFieldsToMarkDown(formValues)
    };
    
    this.setState({ loading: true });
    
    dispatch(updateBitBucketFile(dataObject))
	    .then(() => this.fetchRootDirectoryDataFromBitBucket(accessToken))
      .then(async (resp) => {
	      const params = Object.assign({}, {
		      accessToken,
		      path: href.split('/src')[1]
	      });
	
	      const isLoadingDirectoryFlag = !!fileName;
	      let res = null;
	      
	      if (!isLoadingDirectoryFlag) {
		      res = await dispatch(bitBucketView(params));
	      }
	      
	      this.setState({
		      loading: false,
		      modalOpenFlag: !isLoadingDirectoryFlag,
		      fileName: !isLoadingDirectoryFlag ? this.state.fileName : null,
		      fileContent: !isLoadingDirectoryFlag && res.data ? res.data : null
	      });
      })
      .catch(() => this.setState({ loading: false }))
  };
	
	compileFormFieldsToMarkDown = (dataObj) => {
	  const metaDataVariablesList = ['title', 'image', 'description', 'draft'];
	
	  const turnDown = new TurnDown();
	  
	  const extraMetaDataKeys = Object.keys(dataObj)
                                    .filter(k => k !== 'content' && metaDataVariablesList.indexOf(k) <= -1);
    const validMetaDataKeys = Object.keys(dataObj).filter(k => metaDataVariablesList.indexOf(k) > -1);
    
    let mdStr = '---\n';
	
	  validMetaDataKeys.forEach(k => {
      mdStr += `${k} : ${dataObj[k].toString()}\n`;
    });
	  
	  extraMetaDataKeys.forEach(k => {
		  mdStr += `${k} : ${dataObj[k]}\n`;
	  });
	
	  mdStr += '---\n';
   
	  mdStr += turnDown.turndown(dataObj && dataObj.content) || '';
	  
	  return mdStr;
  };
  
	modalOpen = (addNewFileFlag = false) => {
	  const stateObject = { openRepoFile: true };
	  
	  if (addNewFileFlag) {
	    stateObject.modalOpenFlag = true;
    }
    
	  this.setState(stateObject);
	};
  
  modalClose = () => {
    const { modalOpenFlag } = this.state;
    
    this.setState({
      modalOpenFlag: !modalOpenFlag,
      openRepoFile: false,
	    fileName: null,
	    fileContent: null
    });
  };
  
  messageDismiss = () => this.setState({ showMessageFlag: false });
  
  render () {
    const { isLoad, loadErr, accessToken, bitBucketList = [], handleSubmit, user, message, initialValues } = this.props;
    
    const {
      loading, hideRepoListingAreaFlag, fileName, fileContent, repoPath, modalOpenFlag, openRepoFile, showMessageFlag
    } = this.state;
    
    const errorOccurredFlag = !loading && !isLoad && !user;
    const loadingCompleteFlag = !isLoad;
    const validBitBucketListFlag = loadingCompleteFlag && bitBucketList && Array.isArray(bitBucketList) &&
      bitBucketList.length;
    
    const isFileLoadedSuccessFlag = fileName;
    
    if (errorOccurredFlag) {
      return (
        <div>
          <span style={{ color: 'red' }}>Session Expired</span>
        </div>
      );
    }
    
    return (
      <div>
        {
          message && showMessageFlag &&
          <Message onDismiss={this.messageDismiss}>
            <span style={{ color: 'green' }}>{ message }</span>
          </Message>
        }
        
        {
	        loadErr && showMessageFlag && !modalOpenFlag &&
          <Message onDismiss={this.messageDismiss}>
            <span style={{ color: 'red' }}>{ loadErr }</span>
          </Message>
        }
        
        {
          !accessToken &&
          <Button
            color='facebook'
            onClick={ () => this.bitBucketConnect() }
          >
            <Icon name='bitbucket' /> Fetch Data From BitBucket
          </Button>
        }
        
        {
          !accessToken &&
          <div className="row" style={{ marginTop: '20px' }}>
            Click on the "Fetch Data From BitBucket" button above to get access from BitBucket where you will
            need to login to grant access to "your" BitBucket repository
          </div>
        }
        
        {
	        accessToken &&
          <div className="ui card fluid cardShadow">
            <div className="content pageMainTitle">
              <h4>
                { loadingCompleteFlag ? 'Listing' : 'Loading' } Files From BitBucket Repository
                <Button
                  primary
                  style={{ float: 'right' }}
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
              validBitBucketListFlag && !hideRepoListingAreaFlag &&
              <div className="content">
                <List>
                  <List.Item>
                    { <List.Icon size='large' name='folder open'/> }
                    <List.Content>
                      <List.Header>
                        <span style={{ textAlign: 'center' }}>
                          { bitBucketList[0].path.split('/').slice(-2, -1)[0] || 'src' }
                        </span>
                        <Button
                          primary
                          style={{ float: 'right', marginTop: '-10px' }}
                          onClick={ () => this.modalOpen(true) }
                        >
                          Add File
                        </Button>
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
                                  repo.path.split('/').pop(),
                                  repo.path
                                ) }
                              >
                                <List.Icon
                                  size='large'
                                  verticalAlign='middle'
                                  name={ repo.type === 'commit_directory' ? 'folder' : 'file' }
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
              loadingCompleteFlag && !validBitBucketListFlag && !hideRepoListingAreaFlag &&
              <div className="content">
                <span style={{ color: 'red' }}>{ 'Error loading directory' }</span>
              </div>
            }
            
            {
              !loadingCompleteFlag && !hideRepoListingAreaFlag &&
              <div className="content">
                <Loader active inline='centered'>Loading ...</Loader>
              </div>
            }
          </div>
        }
        
        {
          !loading && loadingCompleteFlag &&
          <Modal
            open={ modalOpenFlag }
            dimmer="blurring"
            closeOnEscape={ true }
            closeOnDimmerClick={ false }
            onClose={this.modalClose}
            size="large"
            closeIcon
          >
            <Modal.Header>
              { fileName && <Icon name='file' size='large' /> }
              <span style={{ marginLeft: '5px' }}>{ fileName || 'Add File' }</span>
            </Modal.Header>
            <Modal.Content>
	            {
		            loadErr && showMessageFlag &&
		            <Message onDismiss={this.messageDismiss}>
			            <span style={{ color: 'red' }}>{ loadErr }</span>
		            </Message>
	            }
              <Modal.Description>
                {
                  !openRepoFile && isFileLoadedSuccessFlag &&
                  <Markup htmlString= { this.getMd(fileContent) } />
                }
                {
                  !openRepoFile && !isFileLoadedSuccessFlag &&
                  <span style={{ color: 'red' }}>Error fetching content</span>
                }
                {
                  openRepoFile && isFileLoadedSuccessFlag &&
                  <EditFile initialValues={initialValues.toJSON() || []} />
                }
                {
	                openRepoFile && !isFileLoadedSuccessFlag &&
                  <AddFile repoPath={repoPath} />
                }
              </Modal.Description>
            </Modal.Content>
            <Modal.Actions>
              {
                openRepoFile &&
                <Button positive onClick={handleSubmit(this.setFile)}>
                  <i aria-hidden='true' className='save icon' />Save
                </Button>
              }
              {
                !openRepoFile &&
                <Button primary onClick={this.modalOpen}>
                  <i aria-hidden='true' className='edit icon' />Edit
                </Button>
              }
              <Button
                primary
                content="Cancel"
                onClick={this.modalClose}
              />
            </Modal.Actions>
          </Modal>
        }
      </div>
    );
  }
}
