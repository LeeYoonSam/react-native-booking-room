'use strict';
import React, {Component} from 'react';
import {
    View,
    Text,
    StyleSheet
} from 'react-native';

import CommonStyle from "../styles/Common.css";

class StatusBar extends Component {
    render() {
        return (
            <View>
                <View style={CommonStyle.statusbar}/>
                <View style={CommonStyle.navbar}>
                    <Text style={CommonStyle.navbarTitle}>{this.props.title}</Text>
                </View>
            </View>
        );
    }
}

module.exports = StatusBar;
