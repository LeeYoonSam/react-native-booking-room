/**
 * @class Login
 */

import {
    TextInput,
    Text,
    View,
    Alert,
    AsyncStorage,
    StyleSheet,
    dismissKeyboard,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";

import React, {Component} from "react";
import * as firebase from "firebase";
import Button from "apsl-react-native-button";
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { Sae } from 'react-native-textinput-effects';

import DismissKeyboard from "dismissKeyboard";

import CommonStyle from "../styles/Common.css";
import SecretText from "../consts/SecretText";
import CommonUtil from "../util/CommonUtil";

import Loading from "./Loading";

class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            email: "",
            password: "",
            response: "",
            showProgress: false,
        };

        this.login = this.login.bind(this);
        this.invalidCheck = this.invalidCheck.bind(this);
    }

    dismissProgress() {
        this.setState({
            showProgress: false
        });
    }

    async login() {
        try {
            await firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password)
                .then((userData) => {
                    this.setState({
                        showProgress: false,
                    }, () => {
                        AsyncStorage.setItem(SecretText.USER_P1_KEY, CommonUtil.encryptByDes(this.state.email));
                        AsyncStorage.setItem(SecretText.USER_P2_KEY, CommonUtil.encryptByDes(this.state.password));

                        this.props.navigator.push({
                            name: 'MyBooking',
                            reset: true
                        });
                    });
                })
                .catch((error) =>
                {
                    this.dismissProgress();
                    console.log("LoginFailed error: " + error);
                    Alert.alert(
                        '',
                        '로그인 실패. 다시 시도해주세요.',
                        [
                            { text: '확인' },
                        ],
                        { cancelable: false }
                    )
                });
        } catch (error) {
            this.dismissProgress();

            let err = error.toString();
            Alert.alert(err);
        }
    }

    render() {
        return (
            <TouchableWithoutFeedback onPress={() => {DismissKeyboard()}}>
                <View style={CommonStyle.container}>
                    <Loading
                        animating={this.state.showProgress}/>

                    <View style={styles.formGroup}>
                        <Text style={styles.title}>{SecretText.APP_TITLE}</Text>

                        <Sae
                            label={'Email Address'}
                            labelStyle={CommonStyle.textStyleGray}
                            inputStyle={CommonStyle.textStyleGrayBlue}
                            iconClass={FontAwesomeIcon}
                            iconColor={'gray'}
                            iconName={'pencil'}
                            autoCapitalize={'none'}
                            autoCorrect={false}
                            multiline={false}
                            keyboardType={'email-address'}
                            onChangeText={(inputEmail) => this.setState({email: inputEmail})}
                          />
                          <Sae
                            label={'Password'}
                            labelStyle={CommonStyle.textStyleGray}
                            inputStyle={CommonStyle.textStyleGrayBlue}
                            iconClass={FontAwesomeIcon}
                            iconColor={'gray'}
                            secureTextEntry={true}
                            autoCapitalize={'none'}
                            autoCorrect={false}
                            multiline={false}
                            onChangeText={(inputPassword) => this.setState({password: inputPassword})}
                          />

                        <View style={styles.submit}>
                            <Button
                              style={CommonStyle.buttonStyleBlue}
                              textStyle={CommonStyle.textStyleWhite}
                              onPress={ this.invalidCheck } >
                              Login
                            </Button>

                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
    }

    invalidCheck() {
        Keyboard.dismiss();

        this.setState({
            showProgress: true,
        }, () => {
            var lengthCheck = this.state.email.length;
            var isEmpty = lengthCheck > 0 ? false : true;
            if(isEmpty) {
                Alert.alert('이메일을 입력해 주세요.');

                this.dismissProgress();

                return;
            }

            lengthCheck = this.state.password.length;
            isEmpty = lengthCheck > 0 ? false : true;
            if(isEmpty) {
                Alert.alert('비밀번호를 입력해 주세요.');

                this.dismissProgress();

                return;
            }

            this.login();
        });
    }
}

const styles = StyleSheet.create({

    formGroup: {
        padding: 50
    },

    title: {
        paddingBottom: 16,
        textAlign: "center",
        color: "#000",
        fontSize: 35,
        fontWeight: "bold",
        opacity: 0.8,
    },

    submit: {
        paddingTop: 30
    },

    response: {
        textAlign: "center",
        paddingTop: 0,
        padding: 50
    }
});

module.exports = Login;
