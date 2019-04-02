import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Image, Menu, Sidebar, Icon, Loader } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import {
	validObjectWithParameterKeys,
	getAbsoluteS3FileUrl,
	validFileName,
	typeCastToString
} from '../../utils/commonutils';
import {
	DEFAULT_USER_PROFILE_IMAGE_URL,
	VALID_ACCESSIBLE_IMAGE_FILE_FORMATS,
	DEFAULT_MILLISECONDS_TO_SHOW_MESSAGES,
	IMAGE_FILE_NAME_BEGIN_REG_EXP,
	USER_PROFILE_TABS
} from '../../utils/constants';
import { updateUserProfile } from '../../redux/modules/account';
import S3FileUploader from '../../components/S3FileUploader';
import config from '../../config';

class VerticalSidebar extends Component {
	state = {
		imageLoading: false,
		uploadProfileImageUrl: null,
		uploadProfileImageName: null,
		uploadProfileImageError: null
	};
	
	componentDidMount = async () => {
		const { user } = this.props;
		const isValidImageUserFlag = validObjectWithParameterKeys(user, ['_id', 'role', 'image']);
		if (isValidImageUserFlag) {
			this.setState({ uploadProfileImageUrl: user.image });
		}
	};
	
	handleProfileImageFinishedUpload = async ({ name, s3Key }) => {
		if (!validFileName(name, VALID_ACCESSIBLE_IMAGE_FILE_FORMATS, IMAGE_FILE_NAME_BEGIN_REG_EXP)) {
			this.setState({ uploadProfileImageError: 'Invalid File Name, a valid image file should only have' +
			'\'.jpg\', \'.jpeg\', \'.png\' or \'.gif\'  extension(s)' });
			setTimeout(() => this.setState({ uploadProfileImageError: null }), DEFAULT_MILLISECONDS_TO_SHOW_MESSAGES);
			return;
		}
		
		this.setState({ uploadProfileImageUrl: s3Key });
	};
	
	resetProfileImageOnComplete = async ({ name }) => {
		const { dispatch } = this.props;
		const { uploadProfileImageUrl } = this.state;
		
		try {
			if (validFileName(name, VALID_ACCESSIBLE_IMAGE_FILE_FORMATS, IMAGE_FILE_NAME_BEGIN_REG_EXP)) {
				this.setState({ imageLoading: true });
				const formData = {
					profileDetails: { image: uploadProfileImageUrl }
				};
				await dispatch(updateUserProfile(formData));
				this.setState({
					imageLoading: false,
					uploadProfileImageName: name
				});
			}
		} catch (err) {
			this.setState({ uploadProfileImageError: typeCastToString(err) || 'Error updating profile image' });
		}
	};
	
	handleLinkClick = query => {
		const { dispatch } = this.props;
	  dispatch(push(`/profile?q=${query}`));
	};
	
	render () {
		const { animation, direction, user } = this.props;
		const { imageLoading, uploadProfileImageUrl, uploadProfileImageError } = this.state;
		const isValidUserFlag = validObjectWithParameterKeys(user, ['_id', 'role']) && user.role > 1;
		return (
			<Sidebar
				as={Menu}
				animation={animation}
				direction={direction}
				icon='labeled'
				inverted
				vertical
				visible={isValidUserFlag}
				width='thin'
			>
				<Menu.Item as='a'></Menu.Item>
				{
					isValidUserFlag &&
					<Menu.Item>
						{
							imageLoading &&
							<Loader active inline='centered'>Loading...</Loader>
						}
						{
							!imageLoading &&
							<Image
								src={getAbsoluteS3FileUrl(uploadProfileImageUrl) || DEFAULT_USER_PROFILE_IMAGE_URL}
								size="small"
								alt="image"
								circular
								centered
							/>
						}
						{
							!imageLoading &&
							<S3FileUploader
								signingUrl={`${config.apiHost}/aws/uploadFile/profileImages`}
								onFileUpload={ this.handleProfileImageFinishedUpload }
								resetOnComplete={ this.resetProfileImageOnComplete }
								toShowContent={ <Icon name='edit' /> }
								toShowContentIcon={ false }
								toShowContentStyle={{
									margin: '2px auto'
								}}
							/>
						}
						{
							!!uploadProfileImageError &&
							<span style={{ color: 'red' }}>{ uploadProfileImageError }</span>
						}
						<div className="mt-10">
							{
								validObjectWithParameterKeys(user, ['email', 'firstName', 'lastName']) &&
								(!!user.firstName || !!user.lastName) &&
								((user.firstName + ' ' + user.lastName).toUpperCase() || user.email.toUpperCase())
							}
						</div>
					</Menu.Item>
				}
				{
					isValidUserFlag &&
					<Menu.Item as='a' onClick={ () => this.handleLinkClick('Home') }>
						<Icon name='home' />
						Home
					</Menu.Item>
				}
			</Sidebar>
		);
	}
}

VerticalSidebar.propTypes = {
	animation: PropTypes.string,
	direction: PropTypes.string,
	visible: PropTypes.bool,
	user: PropTypes.object
};

export default connect(state => ({
	user: state.get('auth').get('user')
}))(VerticalSidebar);
