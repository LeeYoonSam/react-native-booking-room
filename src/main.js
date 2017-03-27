import React, { Component } from 'react';
import {
    Navigator,
    StyleSheet
} from 'react-native';

import Firebase from "./firebase/Firebase";
import * as firebase from "firebase";

// var Login = require('./components/login');
var LoginForFirebase = require('./components/LoginForFirebase');
var MainFloor = require('./components/MainFloor');
var MeetingRoomMain = require('./components/MeetingRoomMain');
var BookRoom = require('./components/BookRoom');

// 스와이프백 제스쳐로 뒤로 가기 막기
const NoBackSwipe = {
    ...Navigator.SceneConfigs.HorizontalSwipeJump,
    gestures: {
        pop: {},
    },
};

module.exports = React.createClass({
    getInitialState: function() {
        return {
            userLoaded: false,
            initialView: null
        };
    },

    // 컴포넌트가 마운트 될때 뷰초기화 시작
    componentWillMount: function() {
        Firebase.initialise();

        this.getInitialView();
    },

    // 로그인 판단해서 어떤 뷰를 보여줄지 결정해서 state 업데이트
    getInitialView() {

        firebase.auth().onAuthStateChanged((user) => {

            console.log("user: " + user);
            let initialView = user ? "MainFloor" : "LoginForFirebase";
            console.log("initialView: " + initialView);

            this.setState({
                userLoaded: true,
                initialView: initialView
            })

            console.log("initialView: " + this.state.initialView);
        });

        this.setState({
            userLoaded: true,
            initialView: "LoginForFirebase"
        })
    },

    // 화면 설정 - MainFloor에서는 뒤로 못가게 처리 (제스쳐 가로채기)
    _configureScene: function(route) {

        switch (route.name) {
            case 'MainFloor':
            return NoBackSwipe
            break;

            default:
            return Navigator.SceneConfigs.PushFromRight
            break;
        }
    },


    // 로그인 여부에 따라 보여주는 화면을 변경
    renderScene: function(route, navigator) {

        console.log("renderScene: " + route.name + " navigator: " + navigator);

        switch (route.name) {
            case "MainFloor":
            return (<MainFloor navigator={navigator} />);
            break;

            case "LoginForFirebase":
            return (<LoginForFirebase navigator={navigator} />);
            break;

            case "MeetingRoomMain":
            return (
                <MeetingRoomMain
                    navigator={navigator}
                    selectRoomData={route.selectRoomData}
                    selectFloor={route.selectFloor}
                    />);
                    break;

            case "BookRoom":
            return (
                <BookRoom
                    navigator={navigator}
                    selectRoomData={route.selectRoomData}
                    selectFloor={route.selectFloor}
                    selectOriginDate={route.selectOriginDate}
                    selectDate={route.selectDate}
                    selectTime={route.selectTime}
                    selectData={route.selectData}
                    isUpdate={route.isUpdate}
                    />);
                    break;
        }
    },

    // 렌더링
    render: function() {
        return (
            <Navigator
                style={ styles.container }
                initialRoute={ {name: this.state.initialView} } // 네비게이션 최상위 뷰 설정
                renderScene={this.renderScene}                  // 화면 렌더링
                configureScene={ this._configureScene }         // 화면 설정
                />
        );
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1
    }
});
