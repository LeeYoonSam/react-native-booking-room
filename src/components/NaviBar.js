'use strict';
import React, {Component} from 'react';
import {
    View,
    Text,
    TouchableHighlight
} from 'react-native';

import CommonStyle from "../styles/Common.css";

class NaviBar extends Component {
    render() {
        return (
            <View zIndex={1}
                style={CommonStyle.topContainer}>
                <TouchableHighlight
                    underlayColor={'transparent'}
                    onPress={this.props.onBackPress}>

                    <View style={{flexDirection: 'row'}}>
                        <Text style={{marginLeft: 15, color: 'black'}}>&lt;</Text>
                        <Text style={{marginLeft: 10, fontSize: 18, color: 'black'}}>{this.props.naviTitle}</Text>
                    </View>

                </TouchableHighlight>
            </View>
        );
    }
}

module.exports = NaviBar;
