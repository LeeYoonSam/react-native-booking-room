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
    TouchableWithoutFeedback
} from "react-native";

import React, {Component} from "react";
import * as firebase from "firebase";
import Button from "apsl-react-native-button";
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { Sae } from 'react-native-textinput-effects';

import DismissKeyboard from "dismissKeyboard";

import CommonStyle from "../styles/Common.css";
import SecretText from "../consts/SecretText";

class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            email: "",
            password: "",
            response: ""
        };

        this.login = this.login.bind(this);
        this.invalidCheck = this.invalidCheck.bind(this);
    }

    async login() {

        try {
            await firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password)
                .then((userData) => {
                    console.log("loginSuccess userData: " + userData);

                    this.props.navigator.push({
                        // name: 'MeetingRoomMain'
                        name: 'MainFloor'
                    });
                })
                .catch((error) =>
                {
                    Alert.alert('Login Failed. Please try again '+error);
                });
        } catch (error) {
            let err = error.toString();

            Alert.alert(err);
        }

        // this.props.navigator.push({
        //     // name: 'MeetingRoomMain'
        //     name: 'MainFloor'
        // });
    }

    render() {
        return (
            <TouchableWithoutFeedback onPress={() => {DismissKeyboard()}}>
                <View style={CommonStyle.container}>
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
        var lengthCheck = this.state.email.length;
        var isEmpty = lengthCheck > 0 ? false : true;
        if(isEmpty) {
            Alert.alert('please input your eamil address');
            return;
        }

        lengthCheck = this.state.password.length;
        isEmpty = lengthCheck > 0 ? false : true;
        if(isEmpty) {
            Alert.alert('please input your password');
            return;
        }

        this.login();
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
