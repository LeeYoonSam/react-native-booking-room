import React, { Component } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableHighlight,
    Alert,
    StyleSheet
} from 'react-native';


module.exports = React.createClass({
    // state 초기화
    getInitialState: function() {
        return {
            userid: '',
            password: ''
        };
    },

    // 화면 렌더링
    render: function() {
        return (
            <View style={styles.container}>
                <View style={styles.loginContainer}>
                    <TextInput
                        style={styles.input}
                        value={this.state.username}
                        onChangeText={(id) => this.setState({userid: id})}
                        placeholder={'Enter User ID'}
                        maxLength={12}
                        multiline={false}
                    />

                    <TextInput
                        style={styles.input}
                        value={this.state.password}
                        secureTextEntry={true}
                        onChangeText={(pwd) => this.setState({password: pwd})}
                        placeholder={'Enter User Password'}
                        maxLength={12}
                        multiline={false}
                    />

                    <TouchableHighlight
                        style={styles.button}
                        underlayColor={'#328FE6'}
                        onPress={this.onPress} >

                        <Text style={styles.label}>LOGIN</Text>

                    </TouchableHighlight>
                </View>
            </View>
        );
    },
    // 로그인 버튼 클릭
    onPress: function() {
        var lengthCheck = this.state.userid.length;
        var isEmpty = lengthCheck > 0 ? false : true;
        if(isEmpty) {
            Alert.alert('please input your ID');
            return;
        }

        lengthCheck = this.state.password.length;
        isEmpty = lengthCheck > 0 ? false : true;
        if(isEmpty) {
            Alert.alert('please input your password');
            return;
        }

        this.props.navigator.push({ name: 'MeetingRoomMain' });
    }
});

var styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'stretch',
      backgroundColor: '#6E5BAA'
    },
    loginContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    input: {
      width: 250,
      color: '#555555',
      marginBottom: 10,
      padding: 10,
      height: 50,
      borderColor: '#32C5E6',
      borderWidth: 1,
      borderRadius: 4,
      alignSelf: 'center',
      backgroundColor: '#ffffff'
    },
    button: {
      justifyContent: 'center',
      alignItems: 'center',
      height: 50,
      borderWidth: 1,
      borderRadius: 5,
      borderColor: '#328FE6',
      padding: 10,
      backgroundColor: '#32c5e6'
    },
    label: {
      width: 230,
      flex: 1,
      alignSelf: 'center',
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '600',
      color: '#ffffff'
    }
});
