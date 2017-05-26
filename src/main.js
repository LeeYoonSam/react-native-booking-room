import React, { Component } from 'react';
import {
    View,
    Navigator,
    AppState,
    Platform,
    AsyncStorage,
    StyleSheet
} from 'react-native';

import backAndroid from 'react-native-back-android';

import Firebase from "./firebase/Firebase";
import fbDB from './firebase/Database';

import PushController from "./firebase/PushController";

import CommonUtil from "./util/CommonUtil";
import SecretText from "./consts/SecretText";

var Splash = require('./components/Splash');
var MyBooking = require('./components/MyBooking');
var LoginForFirebase = require('./components/LoginForFirebase');
var MainFloor = require('./components/MainFloor');
var MeetingRoomMain = require('./components/MeetingRoomMain');
var BookRoom = require('./components/BookRoom');
var UserSearch = require('./components/UserSearch');

// 스와이프백 제스쳐로 뒤로 가기 막기
const NoBackSwipe = {
    ...Navigator.SceneConfigs.HorizontalSwipeJump,
    gestures: {
        pop: {},
    },
};

module.exports = backAndroid(React.createClass({

    getInitialState: function() {
        return {
            userLoaded: false,
            initialView: 'Splash',
            token: "",
            tokenCopyFeedback: "",
        };
    },

    // 컴포넌트가 마운트 될때 뷰초기화 시작
    componentWillMount: function() {
        // this.getInitialView();
    },

    componentDidMount: function() {
        // 앱 시작시 회의실 목록 받아오기
        // fbDB.getAllMeetingRoomList();
    },

    // // 로그인 판단해서 어떤 뷰를 보여줄지 결정해서 state 업데이트
    // getInitialView() {
    //     // 실제 로그인 화면 부터 시작
    //     this.setState({
    //         userLoaded: true,
    //         // 더미 테스트
    //         // initialView: "MyBooking",
    //
    //         initialView: "Splash",
    //     })
    // },

    // 화면 설정 - MyBooking 에서는 뒤로 못가게 처리 (제스쳐 가로채기)
    _configureScene: function(route) {

        switch (route.name) {
            case 'MyBooking':
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
            case "Splash":
            return (<Splash navigator={navigator} />);
                break;

            case "MyBooking":
            return (<MyBooking navigator={navigator} />);
                break;

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
                    updateType={route.updateType}
                    />);
                    break;

            case "UserSearch":
                return (
                    <UserSearch
                        navigator={navigator}
                        selectedUsers={route.selectedUsers}
                        callback={route.callback} />);
                break;
        }
    },

    // 렌더링
    render: function() {

        return (
            <View style={ styles.container}>

                <PushController
                    onChangeToken={token => this.setState({token: token || ""}, () => {

                        // 내부 저장소에 토큰 저장
                        AsyncStorage.setItem("pushToken", this.state.token);
                })} />

                <Navigator
                    ref='navigator'
                    style={ styles.container }
                    initialRoute={ {name: this.state.initialView} } // 네비게이션 최상위 뷰 설정
                    renderScene={this.renderScene}                  // 화면 렌더링
                    configureScene={ this._configureScene }         // 화면 설정
                    onDidFocus={(route) => {
                        if (route.reset) {
                            this.refs.navigator.immediatelyResetRouteStack([{ name: route.name }])
                        }
                    }}
                    />
            </View>
        );
    }
})
);

var styles = StyleSheet.create({
    container: {
        flex: 1
    }
});
