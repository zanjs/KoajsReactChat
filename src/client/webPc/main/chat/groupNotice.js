import React, { PropTypes } from 'react';
import pureRenderMixin from 'react-addons-pure-render-mixin';
import { connect } from 'react-redux';
import moment from 'moment';

import './groupNotice.scss';

import ui from '../../../action/pc';
import user from '../../../action/user';
import FloatPanel from '../floatPanel';

class GroupNotice extends React.Component {
    static propTypes = {
        show: PropTypes.bool.isRequired,
        creator: PropTypes.object,
        me: PropTypes.string,
        linkman: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            editor: false,
        };
        this.shouldComponentUpdate = pureRenderMixin.shouldComponentUpdate.bind(this);
        this.handleSaveClick = this.handleSaveClick.bind(this);
    }

    handleSaveClick() {
        user.updateGroupAnnouncement(this.props.linkman.get('_id'), this.editor.value).then(response => {
            if (response.status === 201) {
                this.setState({ editor: false });
            }
            else {
                if (response.data === 'groupId is invalid') {
                    ui.openNotification('群组ID不正确');
                }
                else if (response.data === 'group not exists') {
                    ui.openNotification('该群组不存在');
                }
                else if (response.data === 'you are not creator of this group') {
                    ui.openNotification('只有群主才有权限修改群公告');
                }
                else {
                    ui.openNotification('修改失败! 服务器发生错误, 请联系管理员.');
                }
            }
        });
    }

    render() {
        const { show, creator, me, linkman } = this.props;

        return (
            <FloatPanel
                onClose={ui.closeGroupNotice}
                show={show}
                title="群公告"
            >
                <div className="group-notice">
                    <div>{ linkman.get('announcementPublisher') } 更新于 { moment(linkman.get('announcementTime')).format('YYYY年MM月DD日 h:mm') }</div>
                    {
                        this.state.editor ?
                            <textarea
                                className="editor"
                                ref={editor => this.editor = editor}
                                defaultValue={linkman.get('announcement')}
                            />
                        :
                            <div className="content">
                                {linkman.get('announcement')}
                            </div>
                    }
                    {
                        creator && creator.get('_id') === me ?
                            <div className="button">
                                {
                                this.state.editor ?
                                    <button
                                        onClick={this.handleSaveClick}
                                    >保存</button>
                                :
                                    <button
                                        onClick={() => this.setState({ editor: true })}
                                    >编辑公告</button>
                            }
                            </div>
                        :
                            null
                    }
                </div>
            </FloatPanel>
        );
    }
}

export default connect(
    state => ({
        show: state.getIn(['pc', 'showGroupNotice']),
    })
)(GroupNotice);
