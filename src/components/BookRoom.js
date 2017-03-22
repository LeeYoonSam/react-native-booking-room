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

import CalendarPicker from '../../library/CalendarPicker/CalendarPicker';

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

        console.log('BookRoom call1');
        var selectData = this.props.selectData;
        var selectOriginDate = this.props.selectOriginDate;

        console.log('BookRoom call2');
        //  수정일때 데이터 복구 (메모, 회의타입 두가지)
        if(selectData !== undefined) {
            console.log('BookRoom call3');
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

            console.log('BookRoom call4');
            this.state = {
                bookMemo: memo !== undefined ? memo : '',
                bookType: tmpType,
                repeatType: tmpRepeatType,
                expiredDate: selectOriginDate,
                expiredDateStr: CommonUtil.dateToYYMMDD(selectOriginDate),
            };

        } else {
            console.log('BookRoom call5');
            this.state = {
                bookMemo: '',
                bookType: CommonConst.BOOK_TYPE[0],
                repeatType: CommonConst.REPEAT_TYPE[0],
                expiredDate: selectOriginDate,
                expiredDateStr: CommonUtil.dateToYYMMDD(selectOriginDate),
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
    }

    onBackPress() {
        this.props.navigator.pop();
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
    checkFbValidFloor(floor, roomID, ) {
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

        var selectDateAry = [];
        console.log('this.props.selectDate: ' + this.props.selectDate);

        var week = new Array('일', '월', '화', '수', '목', '금', '토');

        // !! for 문 데이터 체크 !!
        // 매일(workday 5일) 예약
        if(this.state.repeatType.id === 'day') {

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
            selectDateAry.push(this.props.selectDate);
        }

        console.log(Object.values(selectDateAry));

        // 예약 가능한지 DB 체크
        fbDB.isPossibleBooking(selectDateAry, this.props.selectFloor, this.props.selectRoomData.roomID, this.props.selectTime, callback = (isPossible) => {

            console.log('callback isPossible: ' + isPossible);

            // 이미 예약되어 있으면 팝업 처리
            if(!isPossible) {
                Alert.alert('이미 예약되어있는 시간이 있습니다. 확인 후 다시 시도해주세요.');
                return;
            } else {
                this.bookingFBdb(selectDateAry);
            }
        });


        // // 파이어베이스 DB에 쓰기 - listenWriteBook(yymmdd, floor, roomID, beginTime, endTime, bookType, bookMemo, callback)
        // fbDB.listenWriteBook(selectDateAry, this.props.selectFloor, this.props.selectRoomData.roomID, this.props.selectTime, this.props.selectTime + 1, this.state.repeatType, this.state.bookType, this.state.bookMemo, (isSuccess) => {
        //     // 예약 완료
        //     if(isSuccess) {
        //         Alert.alert('예약이 완료 되었습니다.');
        //         this.onBackPress();
        //     } else {
        //         Alert.alert('예약실패. 다시 시도해주세요.');
        //     }
        //
        // })

    }

    // 파이어베이스 DB에 쓰기(예약)
    bookingFBdb(selectDateAry) {
        // listenWriteBook(yymmdd, floor, roomID, beginTime, endTime, bookType, bookMemo, callback)
        fbDB.listenWriteBook(selectDateAry, this.props.selectFloor, this.props.selectRoomData.roomID, this.props.selectTime, this.props.selectTime + 1, this.state.repeatType, this.state.bookType, this.state.bookMemo, (isSuccess) => {
            // 예약 완료
            if(isSuccess) {
                Alert.alert('예약이 완료 되었습니다.');
                this.onBackPress();
            } else {
                Alert.alert('예약실패. 다시 시도해주세요.');
            }

        })
    }

    _renderCalendar(typeID) {
        var vCalendar;
        if(typeID === "day" || typeID === "week") {
            vCalendar =
            <View>
                <Text style={[styles.bookPointText, CommonStyle.textStyleMainColor, {marginTop: 10}]}>{`만료일: ${this.state.expiredDateStr}`}</Text>

                <CalendarPicker
                    selectedDate={this.state.expiredDate}
                    onDateChange={this.onDateChange}
                    onMonthChange={this.onMonthChange}
                    minDate={this.props.selectOriginDate}
                    screenWidth={150}
                    selectedDayColor={'#5cb2ce'} />
            </View>;
        }

        return vCalendar;
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
                                <Icon name='clock-o' size={iconSize} color={iconColor} />
                            <Text style={styles.bookSectionText}>반복주기</Text>
                            </View>

                            <View style={styles.typeContainer}>
                                {
                                    CommonConst.REPEAT_TYPE.map((repeatInfo, i) => {
                                        var selectBottomColor = repeatInfo.id === this.state.repeatType.id ? '#50829b' : 'transparent';

                                        return (
                                                <View
                                                    key={`${repeatInfo}-${i}`}
                                                    style={[styles.typeView, {borderBottomColor: selectBottomColor}]}>

                                                    <Button
                                                        onPress={() => this.setRepeatType(repeatInfo.id)}
                                                        color='black'
                                                        title={repeatInfo.name}
                                                        accessibilityLabel={`타입지정 ${repeatInfo.name}`} />
                                                </View>
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

}

module.exports = BookRoom;
