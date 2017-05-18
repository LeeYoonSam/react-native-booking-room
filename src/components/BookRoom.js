import React, { Component } from 'react';
import {
    View,
    Text,
    Button,
    TextInput,
    ScrollView,
    Alert,
    Keyboard,
    Dimensions,
    TouchableWithoutFeedback,
    DeviceEventEmitter,
    StyleSheet
} from 'react-native';

import { hardwareBackPress } from 'react-native-back-android';

import CalendarPicker from '../../library/CalendarPicker/CalendarPicker';

import Icon from 'react-native-vector-icons/FontAwesome';

import fbDB from '../firebase/Database';
import FirebaseClient from "../firebase/FirebaseClient";

import NaviBar from './NaviBar';
import Loading from "./Loading";

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
    padding: 15
  },

  viewContainer: {
    flex: 1,
    alignItems: 'stretch',
    marginTop: 5,
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
      marginBottom: 10
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

  selectUserContainer: {
      flex: 1,
      flexWrap: 'wrap',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      height: 40,
  },

});

// 수정 할때 유저ID에 일치하는 사용자를 가져오기 위해 사용
Array.prototype._userIDSearch = function(userIDs) {

    var clone =  this.slice();
    this.length = 0;

    for(var i = 0; i < userIDs.length; i++) {

        var userID = userIDs[i];

        for(var k = 0; k < clone.length; k ++) {
            // userID가 일치하는 유저 추가
            if(clone[k].userID === userID) {
                this.push(clone[k]);
            }
        }
    }

    return this;
}

var iconColor = 'lightsteelblue';
var iconSize = 15;
var selectDateAry = [];

var title = "";

class BookRoom extends Component {
    constructor(props) {
        super(props);

        var selectData = this.props.selectData;
        var selectOriginDate = this.props.selectOriginDate;

        //  수정일때 데이터 복구 (메모, 회의타입 두가지)
        if(selectData !== undefined) {
            console.log("call 1");
            this.setRecoveryUserInfo(selectData);

            title = "수정하기";

            var memo = selectData.bookMemo;
            var repeatType = selectData.repeatType;
            var type = selectData.bookType;

            var tmpRepeatType = CommonConst.REPEAT_TYPE[0];
            var tmpType = CommonConst.BOOK_TYPE[0];

            if(repeatType !== undefined) {
                for (i = 0; i < CommonConst.REPEAT_TYPE.length; i ++) {
                    if(CommonConst.REPEAT_TYPE[i].id === repeatType.id) {
                        tmpRepeatType = CommonConst.REPEAT_TYPE[i];
                        break;
                    }
                }
            }

            if(type !== undefined) {
                for (i = 0; i < CommonConst.BOOK_TYPE.length; i ++) {
                    if(CommonConst.BOOK_TYPE[i].id === type.id) {
                        tmpType = CommonConst.BOOK_TYPE[i];
                        break;
                    }
                }
            }

            this.state = {
                bookMemo: memo !== undefined ? memo : '',
                bookType: tmpType,
                repeatType: tmpRepeatType,
                expiredDate: selectOriginDate,
                expiredDateStr: CommonUtil.dateToYYMMDD(selectOriginDate),
                showProgress: false,
                userSearchTtile: "참석자 검색",
                selectedUsers: [],
                memberObj: {},
            };

        } else {

            title = "예약하기";

            this.state = {
                bookMemo: '',
                bookType: CommonConst.BOOK_TYPE[0],
                repeatType: CommonConst.REPEAT_TYPE[0],
                expiredDate: selectOriginDate,
                expiredDateStr: CommonUtil.dateToYYMMDD(selectOriginDate),
                showProgress: false,
                userSearchTtile: "참석자 검색",
                selectedUsers: [],
                memberObj: {},
            };
        }

        this.onBackPress = this.onBackPress.bind(this);
        this.setBookType = this.setBookType.bind(this);
        this.setRepeatType = this.setRepeatType.bind(this);
        this.fbAddBook = this.fbAddBook.bind(this);
        this.checkFbValidFloor = this.checkFbValidFloor.bind(this);
        this.onDateChange = this.onDateChange.bind(this);
        this._renderCalendar = this._renderCalendar.bind(this);
        this.bookingFBdb = this.bookingFBdb.bind(this);
        this.checkValidUser = this.checkValidUser.bind(this);
        this.getRepeatList = this.getRepeatList.bind(this);
        this.callbackSelectedUsers = this.callbackSelectedUsers.bind(this);
        this.setSelectedUserUI = this.setSelectedUserUI.bind(this);
        this.setRecoveryUserInfo = this.setRecoveryUserInfo.bind(this);
    }

    componentDidMount() {
        this.state.memberObj.owner = fbDB.getAuthUid();

        if(this.props.isUpdate) {
            // 전체 수정일 경우만 리스트를 가져옴
            if(this.props.updateType === CommonConst.BOOKING_TYPE.type_update_all) {
                this.getRepeatList(this.props.selectData.groupID);
            }
        }
    }

    onBackPress() {
        this.props.navigator.pop();
    }

    dismissProgress() {
        this.setState({
            showProgress: false
        });
    }

    // 수정시 사용자 정보 복구
    setRecoveryUserInfo(selectData) {
        try {
            fbDB.getAuthUserList((userLists) => {
                if(selectData !== undefined) {
                    // 복구 유저의 Uid를 담는 변수(예약자는 안불러옴)
                    var memberAry = [];
                    // memberAry.push(selectData.memberInfo.owner);
                    for(var key in selectData.memberInfo.members) {
                        memberAry.push(selectData.memberInfo.members[key]);
                    }

                    // userID와 매칭하는 유저를 담아서 callbackSelectedUsers 함수에 보내서 state와 파라미터 세팅
                    userLists._userIDSearch(memberAry);
                    this.callbackSelectedUsers(userLists);
                }
            });

        } catch (error) {
            console.log("setRecoveryUserInfo error: " + error);

            this.setState({
                showProgress: false,
            });
        }
    }

    // 날짜변경 - 해당날짜에 해당하는 DB데이터 조회
    onDateChange(date) {

        console.log("onDateChange date: " + date);

        // DB-1. 날짜변경 세팅
        // setState 이후 바로 사용했더니 적용이 되지 않아 찾아보니 데이터가 렌더링 된후에 작업을 하라고해서 두번째 인자로 렌더링후에 데이터를 가져오도록 변경했다.
        this.setState({
            expiredDate: date,
            expiredDateStr: CommonUtil.dateToYYMMDD(date)
        }, () => {
            console.log("finalData: " + this.state.expiredDate);
        });
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

    setRepeatType(typeID) {
        console.log("setRepeatType typeID: " + typeID);

        if(this.props.isUpdate) {
            Alert.alert('수정시에는 반복주기 변경이 불가능 합니다.');
            return;
        }

        switch (typeID) {
            case "one":
            this.setState({
                repeatType: CommonConst.REPEAT_TYPE[0],
            })
                break;

            case "day":
            this.setState({
                repeatType: CommonConst.REPEAT_TYPE[1],
            })
                break;

            case "week":
            this.setState({
                repeatType: CommonConst.REPEAT_TYPE[2],
            })
                break;


            default:
        }
    }

    // 파이어베이스 DB에 층과 회의실이 있는지 확인후 존재하면 진행
    checkFbValidFloor(floor, roomID) {

        Keyboard.dismiss();

        this.setState({
            showProgress: true
        }, () => {
            // add check valid - 1. 층 확인 - 파베 체크
            // this.props.selectFloor
            if(roomID === null) {
                fbDB.checkValidRoomInfo(floor, roomID, (isValid) => {
                    if(isValid === false) {
                        Alert.alert('존재하지 않는 층입니다.');
                        this.dismissProgress();
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
                        this.dismissProgress();
                        this.onBackPress();
                        return false;
                    }
                    else {
                        this.fbAddBook();
                    }
                });
            }
        });
    }

    fbAddBook() {
        // add check valid - 3. 날짜 확인 (yyyymmdd 8자 형식)- 유효성 체크
        // this.props.selectDate
        if(CommonUtil.checkLength(this.props.selectDate) !== 8) {
            Alert.alert('유효한 날짜가 아닙니다.\n다시 시도해주세요.');
            this.dismissProgress();
            this.onBackPress();

            return;
        }

        // add check valid - 4. 시간 확인 - 유효성 체크
        // this.props.selectTime
        if(CommonUtil.checkValidEmpty(this.props.selectTime)) {
            Alert.alert('유효한 시간이 아닙니다.\n다시 시도해주세요.');
            this.dismissProgress();
            this.onBackPress();

            return;
        }

        // add check valid - 5. 메모 확인 - 유효성 체크
        // this.state.bookMemo
        if(CommonUtil.checkValidEmpty(this.state.bookMemo)) {

            this.dismissProgress();

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
            this.dismissProgress();

            return;
        }

        console.log('this.props.selectDate: ' + this.props.selectDate);

        var week = new Array('일', '월', '화', '수', '목', '금', '토');

        if(this.props.isUpdate) {
            console.log('업데이트라서 이미 날짜가 들어있음');

            // 개별 수정일 경우 하나만 담기
            if(this.props.updateType === CommonConst.BOOKING_TYPE.type_update_one) {
                selectDateAry = [];
                selectDateAry.push(this.props.selectDate);
            }
        }
        // !! for 문 데이터 체크 !!
        // 매일(workday 5일) 예약
        else if(this.state.repeatType.id === 'day') {

            selectDateAry = [];

            console.log('매일 반복 일수 체크: ' + CommonUtil.calcDiffDays(this.props.selectDate, this.state.expiredDateStr));

            var repeatCount = CommonUtil.calcDiffDays(this.props.selectDate, this.state.expiredDateStr);

            // 시작일자 세팅 하기
            var tmpDate = this.props.selectDate;

            var year = tmpDate.substring(0,4);
            var month = tmpDate.substring(4,6);
            var day = tmpDate.substring(6,8);

            var startDate = new Date(`${month}/${day}/${year}`);

            // console.log('tmpDate: ' + tmpDate + ' startDate: ' + startDate);

            for(i = 0; i <= repeatCount; i++) {
                var dayOfWeek = week[startDate.getDay()];

                // 토,일 (주말) 제외하기
                if(dayOfWeek !== '토' && dayOfWeek !== '일') {
                    console.log('getDay(): ' + startDate.getDay() + ' 요일체크: ' + dayOfWeek);

                    // yymmdd 배열에 담기
                    var makeYMD = CommonUtil.dateToYYMMDD(startDate);
                    selectDateAry.push(makeYMD);
                }

                // 하루씩 증가 시키기
                startDate.setDate(startDate.getDate() + 1);
            }
        }
        // 매주 예약
        else if(this.state.repeatType.id === 'week') {
            selectDateAry = [];

            var diffDays = CommonUtil.calcDiffDays(this.props.selectDate, this.state.expiredDateStr);

            // 시작일자 세팅 하기
            var tmpDate = this.props.selectDate;

            var year = tmpDate.substring(0,4);
            var month = tmpDate.substring(4,6);
            var day = tmpDate.substring(6,8);

            var startDate = new Date(`${month}/${day}/${year}`);

            // 주 단위므로 예약 날짜수 / 7로 다음주의 날짜를 구한다.
            var repeatCount = diffDays / 7;

            for(i = 0; i <= repeatCount; i++) {
                // 주말체크는 필요없을듯 - 평일을 타겟으로 지정할듯 / 주말을 지정하면 주말에 예약 되도록

                // yymmdd 배열에 담기
                var makeYMD = CommonUtil.dateToYYMMDD(startDate);
                selectDateAry.push(makeYMD);

                // 7일씩 증가 시키기
                startDate.setDate(startDate.getDate() + 7);
            }
        }
        // 한번 one
        else {
            selectDateAry = [];

            selectDateAry.push(this.props.selectDate);
        }

        console.log(Object.values(selectDateAry));

        // 일반 예약인지, 수정인지 판단해서 진행
        if(this.props.isUpdate) {
            this.checkValidUser(selectDateAry);
        } else {
            // 예약 가능한지 DB 체크
            fbDB.isPossibleBooking(selectDateAry, this.props.selectFloor, this.props.selectRoomData.roomID, this.props.selectTime, callback = (isPossible) => {

                // 이미 예약되어 있으면 팝업 처리
                if(!isPossible) {
                    Alert.alert('이미 예약되어있는 시간이 있습니다. 확인 후 다시 시도해주세요.');
                    this.dismissProgress();
                    return;
                } else {
                    this.bookingFBdb(selectDateAry);
                }
            });
        }
    }

    // 해당 예약의 groupID 찾고 yymmdd 리스트를 가지고 있음
    getRepeatList(groupID) {
        fbDB.searchGroupId(groupID, (repeatList) => {
            selectDateAry = [];

            for(var date in repeatList.selectedDates) {
                selectDateAry.push(repeatList.selectedDates[date]);
            }
        });
    }

    // 파이어베이스 DB에 쓰기(예약)
    checkValidUser(selectDateAry) {

        fbDB.checkMatchUser(selectDateAry, this.props.selectFloor, this.props.selectRoomData.roomID, this.props.selectTime, callback = (isMatch) => {
            // console.log("listenWriteBook isMatch: " + isMatch);

            // 사용자 정보 일치
            if(isMatch) {
                this.bookingFBdb(selectDateAry);
            }
            // 사용자 정보 일치하지 않음
            else {
                Alert.alert('예약한 사용자만 수정이 가능합니다.');
                this.dismissProgress();
            }
        });
    }

    // 파이어베이스 DB에 쓰기(예약)
    bookingFBdb(selectDateAry) {

        // 수정 처리
        if(this.props.isUpdate) {
            var repeatType = this.state.repeatType;

            if(this.props.updateType === CommonConst.BOOKING_TYPE.type_update_one) {
                repeatType = CommonConst.REPEAT_TYPE[0];
            }

            console.log("bookingFBdb memberObj: " + Object.values(this.state.memberObj));

            // static listenUpdateBook(bookingType, selectDateAry, floor, roomID, beginTime, endTime, repeatType, bookType, bookMemo, callback)
            fbDB.listenUpdateBook(this.props.updateType, selectDateAry, this.props.selectData.memberInfo, this.state.memberObj, this.props.selectFloor, this.props.selectRoomData.roomID, this.props.selectTime, this.props.selectTime + 1, repeatType, this.state.bookType, this.state.bookMemo, this.props.selectData.groupID, (isSuccess) => {
                // 예약 완료
                if(isSuccess) {
                    Alert.alert('예약이 수정 되었습니다.');

                    // 예약된 멤버들에게 즉시 푸시발송 - 메시지 세팅해야함
                    var users = [];
                    console.log("start immediate push");
                    users.push(this.state.memberObj.owner);
                    // users.push(this.state.memberObj.members);

                    try {
                        this.state.memberObj.members.map((userID) => {
                            users.push(userID);
                        });
                    } catch(error) {
                        console.log(error);
                    }

                    console.log("listenUpdateBook users: " + users);

                    fbDB.getUserPushTokens(users, (tokens) => {
                        console.log("listenUpdateBook tokens: " + tokens);
                        if(tokens.length > 0) {
                            var pushDate = '';

                            if(selectDateAry.length > 1) {
                                var tmpDate = selectDateAry[0];
                                var year = tmpDate.substring(0,4);
                                var month = tmpDate.substring(4,6);
                                var day = tmpDate.substring(6,8);

                                var tmpStartDate = `${year}년 ${month}월 ${day}일`

                                tmpDate = selectDateAry[selectDateAry.length -1];
                                year = tmpDate.substring(0,4);
                                month = tmpDate.substring(4,6);
                                day = tmpDate.substring(6,8);

                                var tmpEndDate = `${year}년 ${month}월 ${day}일`

                                pushDate = `${tmpStartDate}~${tmpEndDate}`;
                            } else {
                                var tmpDate = selectDateAry[0];
                                var year = tmpDate.substring(0,4);
                                var month = tmpDate.substring(4,6);
                                var day = tmpDate.substring(6,8);

                                var tmpStartDate = `${year}년 ${month}월 ${day}일`
                                pushDate = `${tmpStartDate}`;
                            }

                            var meetingRoomInfo = fbDB.getAllMeetingRoom();
                            var roomName = meetingRoomInfo[this.props.selectFloor][this.props.selectRoomData.roomID].name;

                            var pushTitle = `${this.props.selectFloor}층 ${roomName} ${this.state.bookType.name} 예약`;
                            var pushContent = `${pushDate} ${this.props.selectTime}시에 예약 되었습니다.`;
                            FirebaseClient.sendData(tokens, pushTitle, pushContent);
                        }


                        // tokens.map( (token) => {
                        //     console.log("listenUpdateBook token: " + token);
                        //
                        //     FirebaseClient.sendData(token);
                        //
                        //     // setTimeout(FirebaseClient.sendData(token), 1000);
                        // });
                    });

                    this.dismissProgress();
                    this.onBackPress();
                } else {
                    Alert.alert('수정 실패. 다시 시도해주세요.');
                    this.dismissProgress();
                }
            })
        }
        // 예약 처리
        else {
            // listenWriteBook(yymmdd, floor, roomID, beginTime, endTime, bookType, bookMemo, callback)
            fbDB.listenWriteBook(selectDateAry, this.state.memberObj, this.props.selectFloor, this.props.selectRoomData.roomID, this.props.selectTime, this.props.selectTime + 1, this.state.repeatType, this.state.bookType, this.state.bookMemo, (isSuccess) => {
                // 예약 완료
                if(isSuccess) {
                    this.dismissProgress();

                    // 예약된 멤버들에게 즉시 푸시발송 - 메시지 세팅해야함
                    var users = [];
                    console.log("start immediate push");
                    users.push(this.state.memberObj.owner);
                    // users.push(this.state.memberObj.members);

                    try {
                        this.state.memberObj.members.map((userID) => {
                            users.push(userID);
                        });
                    } catch(error) {
                        console.log(error);
                    }

                    console.log("listenUpdateBook users: " + users);

                    fbDB.getUserPushTokens(users, (tokens) => {
                        console.log("listenUpdateBook tokens: " + tokens);

                        if(tokens.length > 0) {
                            var pushDate = '';

                            if(selectDateAry.length > 1) {
                                var tmpDate = selectDateAry[0];
                                var year = tmpDate.substring(0,4);
                                var month = tmpDate.substring(4,6);
                                var day = tmpDate.substring(6,8);

                                var tmpStartDate = `${year}년 ${month}월 ${day}일`

                                tmpDate = selectDateAry[selectDateAry.length -1];
                                year = tmpDate.substring(0,4);
                                month = tmpDate.substring(4,6);
                                day = tmpDate.substring(6,8);

                                var tmpEndDate = `${year}년 ${month}월 ${day}일`

                                pushDate = `${tmpStartDate}~${tmpEndDate}`;
                            } else {
                                var tmpDate = selectDateAry[0];
                                var year = tmpDate.substring(0,4);
                                var month = tmpDate.substring(4,6);
                                var day = tmpDate.substring(6,8);

                                var tmpStartDate = `${year}년 ${month}월 ${day}일`
                                pushDate = `${tmpStartDate}`;
                            }

                            var meetingRoomInfo = fbDB.getAllMeetingRoom();
                            var roomName = meetingRoomInfo[this.props.selectFloor][this.props.selectRoomData.roomID].name;

                            var pushTitle = `${this.props.selectFloor}층 ${roomName} ${this.state.bookType.name} 예약`;
                            var pushContent = `${pushDate} ${this.props.selectTime}시에 예약 되었습니다.`;
                            FirebaseClient.sendData(tokens, pushTitle, pushContent);
                        }

                        // tokens.map( (token) => {
                        //     console.log("listenUpdateBook token: " + token);
                        //     FirebaseClient.sendData(token);
                        // });
                    });

                    Alert.alert(
                        '',
                        '예약이 완료 되었습니다.',
                        [
                            { text: '확인', onPress: () =>
                                {
                                    var routes = this.props.navigator.getCurrentRoutes();

                                    // 마이페이지 새로고침이 되지 않아 DeviceEventEmitter 사용해서 호출
                                    DeviceEventEmitter.emit('refreshMyBooking', {});

                                    // 예약이 완료되면 최상단 마이페이지로 보내기
                                    this.props.navigator.popToRoute(routes[1]);
                                }
                            },
                        ],
                        { cancelable: false }
                    );

                } else {
                    Alert.alert('예약실패. 다시 시도해주세요.');
                    this.dismissProgress();
                }
            })
        }
    }

    _renderCalendar(typeID) {
        var vCalendar;
        if(this.props.isUpdate) {
            vCalendar =
            <View>
                <Text style={[styles.bookPointText, CommonStyle.textStyleMainColor, {marginTop: 10}]}>{`만료일: ${this.state.expiredDateStr}`}</Text>
            </View>;
        }
        else if(typeID === "day" || typeID === "week") {
            vCalendar =
            <View>
                <Text style={[styles.bookPointText, CommonStyle.textStyleMainColor, {marginTop: 10}]}>{`만료일: ${this.state.expiredDateStr}`}</Text>

                <CalendarPicker
                    selectedDate={this.state.expiredDate}
                    onDateChange={this.onDateChange}
                    onMonthChange={this.onMonthChange}
                    minDate={this.props.selectOriginDate}
                    screenWidth={150}
                    selectedDayColor={'lightcoral'} />
            </View>;
        }

        return vCalendar;
    }

    render() {
        return (

            <View style={styles.container}>

                <Loading
                    animating={this.state.showProgress}/>

                <NaviBar
                    naviTitle={title}
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
                                <Icon name='users' size={iconSize} color={iconColor} />
                                <Text style={styles.bookSectionText}>회의 참석자</Text>
                            </View>
                            <TouchableWithoutFeedback onPress={() => {this.moveUserList(this.state.memberObj.members)}}>
                                <View style={{backgroundColor: '#50829b', alignItems: 'stretch', borderRadius: 4, margin: 10, padding: 10}}>
                                    <Text
                                        style={{fontSize: 16, fontWeight: "bold", color: 'azure'}}>
                                        {this.state.userSearchTtile}
                                    </Text>
                                </View>
                            </TouchableWithoutFeedback>

                            {this.setSelectedUserUI()}
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
                                <Icon name='clock-o' size={iconSize} color={iconColor} />
                            <Text style={styles.bookSectionText}>반복주기</Text>
                            </View>

                            <View style={styles.typeContainer}>
                                {
                                    CommonConst.REPEAT_TYPE.map((repeatInfo, i) => {
                                        var selectBottomColor = repeatInfo.id === this.state.repeatType.id ? '#50829b' : 'transparent';

                                        return (
                                            <TouchableWithoutFeedback key={`${repeatInfo}-${i}`} onPress={() => {this.setRepeatType(repeatInfo.id) }}>
                                                <View
                                                    style={[styles.typeView, {borderBottomColor: selectBottomColor, padding: 10}]}>

                                                    <Text style={{fontSize: 16, color: 'black'}}>
                                                        {repeatInfo.name}
                                                    </Text>
                                                </View>
                                            </TouchableWithoutFeedback>
                                        )
                                    })
                                }
                            </View>

                            <View>{this._renderCalendar(this.state.repeatType.id)}</View>
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
                                            <TouchableWithoutFeedback key={`${bookInfo}-${i}`} onPress={() => {this.setBookType(bookInfo.id) }}>
                                                <View style={[styles.typeView, {borderBottomColor: selectBottomColor, padding: 10}]}>

                                                    <Text style={{fontSize: 16, color: 'black'}}>
                                                        {bookInfo.name}
                                                    </Text>
                                                </View>
                                            </TouchableWithoutFeedback>
                                        )
                                    })
                                }
                            </View>

                        </View>

                    </View>
                </ScrollView>

                <TouchableWithoutFeedback onPress={() => {this.checkFbValidFloor(this.props.selectFloor, null) }}>
                    <View style={{backgroundColor: '#50829b', alignItems: 'center', borderRadius: 4, margin: 10, padding: 10}}>
                        <Text
                            style={{fontSize: 16, fontWeight: "bold", color: 'azure'}}>
                            {title}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>


            </View>
      )
    }

    moveUserList(_selectedUserIDs) {
        // 팝업 띄우기
        this.props.navigator.push({
            name: 'UserSearch',
            selectedUsers: _selectedUserIDs,
            callback: this.callbackSelectedUsers,
        });
    }

    callbackSelectedUsers(_selectedUsers) {
        if(_selectedUsers.length === 0) {
            this.setState({
                selectedUsers: [],
                userSearchTtile: "참석자 검색",
            });
        }
        else if(_selectedUsers.length === 1) {
            this.setState({
                selectedUsers: _selectedUsers,
                userSearchTtile: `${_selectedUsers[0].userName}`,
            });
        } else {
            this.setState({
                selectedUsers: _selectedUsers,
                userSearchTtile: `${_selectedUsers[0].userName} 외 ${_selectedUsers.length -1}명`,
            });
        }

        // userID만 담는 객체
        this.state.memberObj.members = [];

        _selectedUsers.map((user)=> {
            this.state.memberObj.members.push(user.userID);
        }, () => {
            this.setSelectedUserUI();
        });

        console.log("after selectedUsers memberObj: " + Object.values(this.state.memberObj));
    }

    // 유저 선택 후 UI 세팅
    setSelectedUserUI() {
        try {
            // 유저 선택하고 유저이름 보여주는 부분에 라인과 간격조절을 위해 marginBottom 조정
            var userContainerBottomMargin = (this.state.selectedUsers.length / 5) * 30;
            console.log("userContainerBottomMargin: " + userContainerBottomMargin + " this.state.selectedUsers: " + this.state.selectedUsers);
            return (
                <View style={[styles.selectUserContainer, {marginBottom: userContainerBottomMargin}]}>
                    {
                        this.state.selectedUsers.map((user)=> {
                            console.log("setSelectedUserUI user: " + Object.values(user))
                            return (
                                <View style={{marginRight: 5}}
                                    key={`users-${user.userID}`}>
                                    <Text style={{fontSize: 16, color: 'black', padding:5, borderColor: 'cornflowerblue',
                                        borderWidth: 1,
                                        borderRadius: 4,
                                        backgroundColor: '#ffffff'}}>
                                        {user.userName}
                                    </Text>
                                </View>
                            )
                        })
                    }
                </View>
            )

            this.setState({
                showProgress: false,
            });
        } catch(error) {
            console.log("setSelectedUserUI error: " + error.toString());
        }
    }
}
const handleBackButtonPress = ({ navigator }) => {
    navigator.pop();
    return true;
};

module.exports = hardwareBackPress(BookRoom, handleBackButtonPress);
