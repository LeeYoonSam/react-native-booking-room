'use strict';
import React, {Component} from 'react';
import {
    View,
    Text,
    TouchableHighlight,
    Platform,
    Dimensions,
} from 'react-native';

import CommonStyle from "../styles/Common.css";

const window = Dimensions.get('window');

class NaviBar extends Component {
    constructor(props) {
        super(props);
    }

    renderRightButton() {
        if(this.props.rightBtnTitle) {
            return (
                <View style={{position: 'absolute', width:window.width, alignItems:'flex-end'}}>
                    <TouchableHighlight
                        underlayColor={'transparent'}
                        onPress={this.props.onClickRight}>
                            <Text style={{marginRight: 10, fontSize: 18, color: '#50829b'}}>{this.props.rightBtnTitle}</Text>
                    </TouchableHighlight>
                </View>
            );
        }
    }

    render() {
        return (
            <View zIndex={1}
                style={[CommonStyle.topContainer, {marginTop: (Platform.OS === 'ios') ? 22 : 0}]}>
                <TouchableHighlight
                    underlayColor={'transparent'}
                    onPress={this.props.onBackPress}>

                    <View style={{flexDirection: 'row'}}>
                        <Text style={{marginLeft: 15, color: 'black'}}>&lt;</Text>
                        <Text style={{marginLeft: 10, fontSize: 18, color: 'black'}}>{this.props.naviTitle}</Text>
                        {this.renderRightButton()}
                    </View>

                </TouchableHighlight>
            </View>
        );
    }
}

NaviBar.propTypes = {
    onClickRight: React.PropTypes.func,
};

module.exports = NaviBar;
