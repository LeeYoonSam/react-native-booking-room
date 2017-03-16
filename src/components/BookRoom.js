import React, { Component } from 'react';
import {
    View,
    Text,
    Button,
    TextInput,
    ScrollView,
    Alert,
    Dimensions,
    StyleSheet
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

import fbDB from '../firebase/Database';

import NaviBar from './NaviBar';

import CommonConst from "../consts/CommonConst";
import CommonStyle from "../styles/Common.css";
import CommonUtil from "../util/CommonUtil";

const window = Dimensions.get('window');

var styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: 'white',
  },

  viewRootContainer: {

    alignItems: 'stretch',
    padding: 10
  },

  viewContainer: {
    flex: 1,
    alignItems: 'stretch',
  },

  bookSectionText: {
      fontSize: 16,
      fontWeight: "bold",
      color: 'lightsteelblue',
      marginLeft: 5,
  },

  bookPointText: {
      fontSize: 20,
      fontWeight: "bold",
      marginLeft: 15,
  },

  input: {
    width: 300,
    color: '#555555',
    fontSize: 14,
    marginLeft: 15,
    marginBottom: 10,
    padding: 10,
    height: 50,
    borderColor: 'cornflowerblue',
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: '#ffffff'
  },

  separatedLine: {
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 20,
    height: 0.5,
    justifyContent: 'center',
    backgroundColor: 'gainsboro',
  },

  iconWithSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5
  },

  typeContainer: {
      alignItems: 'center',
      borderRadius: 4,
      flexDirection: 'row',
  },

  typeView: {
      alignItems: 'center',
      borderColor: 'transparent',
      borderWidth: 2,
  },

});

var iconColor = 'lightsteelblue';
var iconSize = 15;

class BookRoom extends Component {
    constructor(props) {
        super(props);

        this.state = {
            bookMemo: '',
            bookType: CommonConst.BOOK_TYPE[0],
        };

        this.onBackPress = this.onBackPress.bind(this);
        this.setBookType = this.setBookType.bind(this);
        this.fbAddBook = this.fbAddBook.bind(this);
        this.checkFbValidFloor = this.checkFbValidFloor.bind(this);
    }

    onBackPress() {
        this.props.navigator.pop();
    }

    setBookType(typeID) {
        console.log("typeID: " + typeID);

        switch (typeID) {
            case "m":
            this.setState({
                bookType: CommonConst.BOOK_TYPE[0],
            })
                break;

            case "i":
            this.setState({
                bookType: CommonConst.BOOK_TYPE[1],
            })
                break;

            case "s":
            this.setState({
                bookType: CommonConst.BOOK_TYPE[2],
            })
                break;

            case "e":
            this.setState({
                bookType: CommonConst.BOOK_TYPE[3],
            })
                break;

            default:
        }
    }

    // 파이어베이스 DB에 층과 회의실이 있는지 확인후 존재하면 진행
    checkFbValidFloor(floor, roomID) {

        // add check valid - 1. 층 확인 - 파베 체크
        // this.props.selectFloor
        if(roomID === null) {
            fbDB.checkValidRoomInfo(floor, roomID, (isValid) => {
                if(isValid === false) {
                    Alert.alert('존재하지 않는 층입니다.');
                    this.onBackPress();
                    return false;
                } else {
                    this.checkFbValidFloor(floor, this.props.selectRoomData.roomID);
                }
            });
        }
        // add check valid - 2. 회의실 확인 - 파베 체크
        // this.props.selectRoomData.roomTitle
        // this.props.selectRoomData.roomID
        else {
            fbDB.checkValidRoomInfo(floor, roomID, (isValid) => {
                if(isValid === false) {
                    Alert.alert('존재하지 않는 회의실 입니다.');
                    this.onBackPress();
                    return false;
                }
                else {
                    this.fbAddBook();
                }
            });
        }

    }

    fbAddBook() {
        // add check valid - 3. 날짜 확인 (yyyymmdd 8자 형식)- 유효성 체크
        // this.props.selectDate
        if(CommonUtil.checkLength(this.props.selectDate) !== 8) {
            Alert.alert('유효한 날짜가 아닙니다.\n다시 시도해주세요.');

            this.onBackPress();

            return;
        }

        // add check valid - 4. 시간 확인 - 유효성 체크
        // this.props.selectTime
        if(CommonUtil.checkValidEmpty(this.props.selectTime)) {
            Alert.alert('유효한 시간이 아닙니다.\n다시 시도해주세요.');

            this.onBackPress();

            return;
        }

        // add check valid - 5. 메모 확인 - 유효성 체크
        // this.state.bookMemo
        if(CommonUtil.checkValidEmpty(this.state.bookMemo)) {
            Alert.alert(
                '',
                '회의명 등 간단한 메모를 남겨주세요!',
                [
                    { text: '확인', onPress: () => this.refs.memoInput.focus() },
                ],
                { cancelable: false }
            )

            return;
        }

        // add check valid - 6. 회의 타입 - 유효성 체크
        // this.state.bookType
        if(CommonUtil.checkLength(this.state.bookType.id) !== 1) {
            Alert.alert('회의 종류가 선택 되지 않았습니다.');

            return;
        }

        // listenWriteBook(yymmdd, floor, roomID, beginTime, endTime, bookType, bookMemo, callback)
        fbDB.listenWriteBook(this.props.selectDate, this.props.selectFloor, this.props.selectRoomData.roomID, this.props.selectTime, this.props.selectTime + 1, this.state.bookType, this.state.bookMemo, (isSuccess) => {
            // 예약 완료
            if(isSuccess) {
                Alert.alert('예약이 완료 되었습니다.');
                this.onBackPress();
            } else {
                Alert.alert('예약실패. 다시 시도해주세요.');
            }

        })

    }

    render() {
        return (

            <View style={styles.container}>

                <NaviBar
                    naviTitle="예약하기"
                    onBackPress={this.onBackPress} />

                <ScrollView>

                    <View style={styles.viewRootContainer}>
                        <View style={styles.viewContainer}>
                            <View style={styles.iconWithSection}>
                                <Icon name='cube' size={iconSize} color={iconColor} />
                                <Text style={styles.bookSectionText}>장소</Text>
                            </View>

                            <Text style={[styles.bookPointText, CommonStyle.textStyleMainColor]}>{`${this.props.selectFloor}층 / ${this.props.selectRoomData.roomTitle}`}</Text>
                        </View>

                        <View style={styles.separatedLine} />

                        <View style={styles.viewContainer}>
                            <View style={styles.iconWithSection}>
                                <Icon name='clock-o' size={iconSize} color={iconColor} />
                            <Text style={styles.bookSectionText}>시간</Text>
                            </View>
                            <Text style={[styles.bookPointText, CommonStyle.textStyleMainColor]}>{`${this.props.selectDate} / ${this.props.selectTime} ~ ${this.props.selectTime + 1}시`}</Text>
                        </View>

                        <View style={styles.separatedLine} />

                        <View style={styles.viewContainer}>
                            <View style={styles.iconWithSection}>
                                <Icon name='pencil-square-o' size={iconSize} color={iconColor} />
                            <Text style={styles.bookSectionText}>메모</Text>
                            </View>
                            <TextInput
                                ref='memoInput'
                                style={styles.input}
                                value={this.state.bookMemo}
                                onChangeText={(memo) => this.setState({bookMemo: memo})}
                                placeholder={'간단하게 메모를 작성해주세요.'}
                                multiline={true} />
                        </View>


                        <View style={styles.separatedLine} />

                        <View style={styles.viewContainer}>
                            <View style={styles.iconWithSection}>
                                <Icon name='tags' size={iconSize} color={iconColor} />
                            <Text style={styles.bookSectionText}>분류</Text>
                            </View>

                            <View style={styles.typeContainer}>
                                {
                                    CommonConst.BOOK_TYPE.map((bookInfo, i) => {
                                        var selectBottomColor = bookInfo.id === this.state.bookType.id ? bookInfo.color : 'transparent';

                                        return (
                                            <View
                                                key={`${bookInfo}-${i}`}
                                                style={[styles.typeView, {borderBottomColor: selectBottomColor}]}>

                                                <Button
                                                    onPress={() => this.setBookType(bookInfo.id)}
                                                    color='black'
                                                    title={bookInfo.name}
                                                    accessibilityLabel={`타입지정 ${bookInfo.name}`} />
                                            </View>

                                        )
                                    })
                                }
                            </View>
                        </View>

                    </View>
                </ScrollView>

                <View style={{backgroundColor: '#50829b', margin: 10}}>
                    <Button
                        style={{alignItems: 'flex-end', fontWeight: "bold",}}
                        title='예 약 하 기'
                        color='azure'
                        onPress={() => this.checkFbValidFloor(this.props.selectFloor, null)}
                        accessibilityLabel='예약하기' />
                </View>

            </View>
      )
    }

    // <View>
    //     {
    //         CommonConst.BOOK_TYPE.map((bookInfo, i) => {
    //               return (
    //                   <Button
    //                       style={{backgroundColor : bookInfo.color, opacity: 0.7}}
    //                       onPress={this.setBookType(bookInfo.id)}
    //                       title={bookInfo.name}
    //                       accessibilityLabel={`타입지정 ${bookInfo.name}`} />
    //               )
    //         })
    //     }
    // </View>

}

module.exports = BookRoom;
