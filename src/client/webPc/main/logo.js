import React from 'react';
import pureRenderMixin from 'react-addons-pure-render-mixin';

import './logo.scss';


class Logo extends React.Component {
    constructor(props) {
        super(props);
        this.shouldComponentUpdate = pureRenderMixin.shouldComponentUpdate.bind(this);
    }

    render() {
        return (
            <div className="logo">
                <img src="http://github.panli.com/img/favicon.png" width="60" />
            </div>
        );
    }
}

export default Logo;
