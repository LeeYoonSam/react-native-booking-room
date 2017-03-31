'use strict';
import React, {Component} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform
} from 'react-native';

import CommonStyle from "../styles/Common.css";

class StatusBar extends Component {
    render() {
        return (
            <View>
                <View style={ {backgroundColor: '#fff', height: (Platform.OS === 'ios') ? 22 : 0} }/>
                <View style={CommonStyle.navbar}>
                    <Text style={CommonStyle.navbarTitle}>{this.props.title}</Text>
                </View>
            </View>
        );
    }
}

module.exports = StatusBar;
