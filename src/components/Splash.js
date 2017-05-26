import React, { Component } from 'react';
import {
    View,
    Text,
    Dimensions,
    AsyncStorage,
    StyleSheet
} from 'react-native';

import SecretText from "../consts/SecretText";

import Loading from "./Loading";

import fbDB from '../firebase/Database';

import CommonUtil from "../util/CommonUtil";

const window = Dimensions.get('window');

var styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'white',
    },

    splashText: {
        fontSize: 35,
        color: 'black',
        marginTop: (window.height / 6) * 2
    }
});

class Splash extends Component {

    constructor(props) {
        super(props);

        this.state = {
            showProgress: false
        }

        this.moveNext = this.moveNext.bind(this);
        this.checkAutoLogin = this.checkAutoLogin.bind(this);
        this.login = this.login.bind(this);
    }

    componentDidMount() {
        this.moveNext();
    }

    moveNext() {
        try {
            this.setState({
                showProgress: true,
            }, () => {
                // 회의실 전체 정보 미리 가져오기
                fbDB.getAllMeetingRoomList( (isSuccess) => {
                    setTimeout( () => {
                        this.checkAutoLogin();
                    }, 2000);
                });
            });
        } catch (e) {
            console.log("moveNext error: " + e);
        }
    }

    async checkAutoLogin() {
        try {
            // 자동 로그인 시도
            var userP1;
            var userP2;

            try {
                const _userP1 = await AsyncStorage.getItem(SecretText.USER_P1_KEY);
                if (_userP1 !== null){
                    userP1 = CommonUtil.decryptByDES(_userP1);
                }

                const _userP2 = await AsyncStorage.getItem(SecretText.USER_P2_KEY);
                if (_userP2 !== null){
                    userP2 = CommonUtil.decryptByDES(_userP2);
                }

            } catch (error) {
                console.log("AsyncStorage get error: " + error);
            }

        } catch (error) {
            console.log("AsyncStorage get error: " + error);
        }

        if(userP1 !== undefined && userP2 !== undefined) {

            this.setState({
                email: userP1,
                password: userP2
            }, () => {
                setTimeout( () => {
                    this.login();
                }, 1000);
            });

            return;
        }

        // 자동로그인 정보가 없으면 로그인 페이지로 이동
        this.props.navigator.push({
            name: 'LoginForFirebase'
        });
    }

    async login() {
        try {
            console.log("call autologin");

            await fbDB.getFirebase().auth().signInWithEmailAndPassword(this.state.email, this.state.password)
                .then((userData) => {
                    // 로그인 성공시 마이페이지로 이동
                    this.props.navigator.push({
                        name: 'MyBooking',
                        reset: true
                    });
                })
                .catch((error) =>
                {
                    console.log("Splash LoginFailed error: " + error);

                    // 로그인 실패시 로그인 페이지로 이동
                    this.props.navigator.push({
                        name: 'LoginForFirebase'
                    });

                });
        } catch (error) {
            console.log("Splash login error: " + error);

            // 로그인 실패시 로그인 페이지로 이동
            this.props.navigator.push({
                name: 'LoginForFirebase'
            });
        }
    }

    render() {
        return (
            <View style={styles.container}>

                <Loading
                    animating={this.state.showProgress}/>

                <Text style={styles.splashText}>{SecretText.APP_TITLE}</Text>

            </View>
        )
    }
}

module.exports = Splash;
