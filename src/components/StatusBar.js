'use strict';
import React, {Component} from 'react';
import {
    View,
    Text,
    TouchableHighlight,
    StyleSheet,
    Platform
} from 'react-native';

import CommonStyle from "../styles/Common.css";

class StatusBar extends Component {

    renderRightButton() {
        if(this.props.rightBtnTitle) {
            return (

                <TouchableHighlight
                    style={{position: 'absolute', height: 60, justifyContent: 'center'}}
                    underlayColor={'transparent'}
                    onPress={this.props.onClickRight}>
                        <Text style={{marginLeft: 10, fontSize: 18, color: '#50829b'}}>{this.props.rightBtnTitle}</Text>
                </TouchableHighlight>

            );
        }
    }

    render() {
        return (
            <View>
                <View style={ {backgroundColor: '#fff', height: (Platform.OS === 'ios') ? 22 : 0} }/>
                <View style={[CommonStyle.navbar]}>
                    <Text style={CommonStyle.navbarTitle}>{this.props.title}</Text>
                </View>

                {this.renderRightButton()}
            </View>
        );
    }
}

module.exports = StatusBar;
