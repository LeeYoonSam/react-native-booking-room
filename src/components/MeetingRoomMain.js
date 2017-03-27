import React, { Component } from 'react';
import {
    View,
    Text,
    ListView,
    Alert,
    TouchableHighlight,
    Dimensions,
    ActionSheetIOS,
    StyleSheet
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

import fbDB from '../firebase/Database';
import CommonUtil from '../util/CommonUtil';

import ParallaxScrollView from 'react-native-parallax-scroll-view';

import CalendarPicker from '../../library/CalendarPicker/CalendarPicker';

import NaviBar from './NaviBar';

import CommonStyle from "../styles/Common.css";
import CommonConst from "../consts/CommonConst";

import Loading from "./Loading";

const window = Dimensions.get('window');

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },

    selectedDate: {
        backgroundColor: 'rgba(0,0,0,0)',
        color: 'white',
    },

    timeTableContainer: {
        flex: 1,
        marginTop: 10,
    },

    rowContainer: {
        width: window.width,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingRight: 10,
    },

    rowTimeContainer: {
        width: 40,
        height: 40,
        borderRadius: 40/2,
        justifyContent: 'center',
        alignItems: 'center',
    },

    rowTimeText: {
        fontSize: 18,
        color: 'white',
    },

    rowMemoContainer: {
        flex: 1,
        height: 80,
        padding: 10,
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'stretch',
        flexDirection: 'column',
        opacity: 0.7,
    },

    rowMemoTextTitle: {
        fontSize: 16,
        color: 'aliceblue'
    },

    rowMemoTextUser: {
        fontSize: 12,
        color: 'aliceblue'
    },
});

const stickyHeight = 40;
const calendarHeight = 300;

function FIXED_BASETIME() {
    var staticArr = [
        {"hour":9},
        {"hour":10},
        {"hour":11},
        {"hour":12},
        {"hour":13},
        {"hour":14},
        {"hour":15},
        {"hour":16},
        {"hour":17},
        {"hour":18},
        {"hour":19},
        {"hour":20},
        {"hour":21},
        {"hour":22}
    ];

    if (!('prototypemethodsset' in FIXED_BASETIME)){
        var proto = FIXED_BASETIME.prototype;
        proto.getArr = function(){
            return staticArr;
        };
        proto.prototypemethodsset = true;
    }
}

var timeJson = [].concat(CommonConst.TIME_JSON);
var fixedTimeList = new FIXED_BASETIME;
var tempList = fixedTimeList.getArr();

var BUTTONS = [
  '수정하기',
  '삭제하기',
  '취소',
];

var DESTRUCTIVE_INDEX = 1;
var CANCEL_INDEX = 2;

class MeetingRoomMain extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ds : new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
            date: new Date(),
            dateStr: CommonUtil.dateToYYMMDD(new Date()),
            showProgress: true,
        };

        this.getBookList = this.getBookList.bind(this);
        this.onDateChange = this.onDateChange.bind(this);
        this.onBookPress = this.onBookPress.bind(this);
        this.onBackPress = this.onBackPress.bind(this);
        this._renderTimeTable = this._renderTimeTable.bind(this);
        this.getRepeatList = this.getRepeatList.bind(this);
    }

    componentWillMount() {

        this.setState({
            // dataSource: this.state.ds.cloneWithRows(CommonConst.TIME)
            dataSource: this.state.ds.cloneWithRows(tempList)
        });
    }

    componentDidMount() {

        this.getBookList();
    }


    // 해당 예약의 groupID 찾고 / 완전한 path를 만들어서 미리 세팅 - ex) BookData/yymmdd/floor/roomID/beginTime
    // 추후에 '일괄 수정'시 this.state.repeatDates와 변경된 내용을 같이 보내서 FB DB에 삽입 처리
    getRepeatList(rowData) {

        this.setState({
            showProgress: true
        }, () => {
            fbDB.searchGroupId(rowData.groupID, callback = (repeatList) => {
                var tmpDates = [];

                repeatList.map((repeat) => {
                    tmpDates.push(`BookData/${repeat.seltedDate}/${this.props.selectFloor}/${this.props.selectRoomData.roomID}/${rowData.beginTime}`);
                });

                this.setState({
                    repeatDates: tmpDates
                }, () => {
                    console.log("getRepeatList convert path: " + Object.values(this.state.repeatDates));
                    this.fbDeleteBooking();
                });
            });
        })
    }

    // 예약 리스트를 가져와서 해당 날짜에 표시해주기
    async getBookList() {

        this.setState({
            showProgress: true,
        }, () => {
            console.log("getBookList this.state.dateStr: " + this.state.dateStr);
            fixedTimeList = new FIXED_BASETIME;
            tempList = fixedTimeList.getArr();

            console.log("getBookList tempList: " + Object.values(tempList[0]));

            // DB-1. 파이어베이스 DB 조회
            // this.state.date(파싱해야함 yymmdd 형식으로)를 이용해서 데이터 조회
            // firebase ex) listenDayBookList(yymmdd, floor, roomID, callback)
            fbDB.listenDayBookList(this.state.dateStr, this.props.selectFloor, this.props.selectRoomData.roomID, (bookLists) => {
                bookLists.map((book) => {
                    // 9시 부터 시작하기 때문에 -9를 해주면 position 0부터 순차 진행 ex) beginTime === 9 => position: 0,  beginTime === 15 => position: 6
                    var bookPosition = book.beginTime - 9;

                    // 회의실 시간이 일치하는 리스트에 데이터를 업데이트 해준다.
                    var item = tempList[bookPosition];
                    item.userID = book.userID;
                    item.userEmail = book.userEmail;
                    item.groupID = book.groupID;
                    item.beginTime = book.beginTime;
                    item.endTime = book.endTime;
                    item.bookMemo = book.bookMemo;
                    item.bookType = book.bookType;
                    item.repeatType = book.repeatType;
                });

                // // DB-2. callback에서 전체 시간별 예약 리스트를 가져옴
                this.setState({
                    dataSource: this.state.ds.cloneWithRows(tempList),
                    showProgress: false,
                });
            });
        });




    }

    // 날짜변경 - 해당날짜에 해당하는 DB데이터 조회
    onDateChange(date) {

        console.log("onDateChange date: " + date);

        // DB-1. 날짜변경 세팅
        // setState 이후 바로 사용했더니 적용이 되지 않아 찾아보니 데이터가 렌더링 된후에 작업을 하라고해서 두번째 인자로 렌더링후에 데이터를 가져오도록 변경했다.
        this.setState({
            date: date,
            dateStr: CommonUtil.dateToYYMMDD(date)
        }, () => {
            this.getBookList();
        });
    }

    // 예약화면으로 넘기기
    onBookPress(selectRow) {

        console.log("onBookPress selectRow: " + Object.values(selectRow));
        console.log("onBookPress userID: " + selectRow.userID);

        // 이미 예약되어있으면 아무 반응이 없도록 처리
        // 파이어베이스에서 boolean 처리할지 로컬에서 판단할지 고민!!!!
        if(selectRow.userID !== undefined) {

            // 내가 쓴글일때 수정/삭제 팝업 보여줌
            if(selectRow.userID === fbDB.getAuthUid()) {
                console.log("내가쓴글!! 수정 팝업 보여주자!!");

                this.showActionSheet(selectRow);
                return;
            }

            console.log("onBookPress call userID !== null");

            return;
        }

        // 팝업 띄우기
        this.props.navigator.push({
            name: 'BookRoom',
            selectRoomData: this.props.selectRoomData,
            selectFloor: this.props.selectFloor,
            selectDate: this.state.dateStr,
            selectTime: selectRow.hour,
            selectOriginDate: this.state.date,
            isUpdate: false,
        });
    }

    showActionSheet = (selectRow) => {
        ActionSheetIOS.showActionSheetWithOptions({
            options: BUTTONS,
            cancelButtonIndex: CANCEL_INDEX,
            destructiveButtonIndex: DESTRUCTIVE_INDEX,
            tintColor: 'black',
        },
        (buttonIndex) => {
            this.setState({
                clicked: BUTTONS[buttonIndex]
            });

            console.log("showActionSheet index: " + buttonIndex);

            switch (buttonIndex) {
                case CANCEL_INDEX:

                    break;
                case DESTRUCTIVE_INDEX:
                Alert.alert(
                    '',
                    '예약을 삭제 하시겠습니까?',
                    [
                        // {text: '삭제', onPress: () => this.fbDeleteBooking(selectRow.hour)},
                        {text: '삭제', onPress: () => this.getRepeatList(selectRow)},
                        {text: '취소', onPress: () => console.log('취소!')},
                    ])
                    break;
                default:
                    // 팝업 띄우기
                    this.props.navigator.push({
                        name: 'BookRoom',
                        selectRoomData: this.props.selectRoomData,
                        selectFloor: this.props.selectFloor,
                        selectDate: this.state.dateStr,
                        selectTime: selectRow.hour,
                        selectData: selectRow,
                        selectOriginDate: this.state.date,
                        isUpdate: true,
                    });
                    break;
            }

        });
    };

    dismissProgress() {
        this.setState({
            showProgress: false
        });
    }

    fbDeleteBooking = () => {

        this.setState({
            showProgress: true,
        }, () => {
            // 1. Firebase DB 에서 yymmdd/층/회의실/시간/userID를 비교 / 자신이 쓴 글이면 삭제 처리
            // checkMatchUser(yymmdd, floor, roomID, beginTime, callback)
            // fbDB.checkAndDeleteMatchUser(this.state.dateStr, this.props.selectFloor, this.props.selectRoomData.roomID, beginTime, (isSuccess) => {
            fbDB.checkAndDeleteMatchUser(this.state.repeatDates, (isSuccess) => {
                // 삭제 완료
                if(isSuccess) {
                    Alert.alert('삭제가 완료 되었습니다.');
                } else {
                    Alert.alert('삭제실패. 다시 시도해주세요.');
                }

                this.dismissProgress();
            });
        });
    }

    onBackPress = () => {
        this.props.navigator.pop();
    }

    _renderTimeTable(rowData) {
        var baseColor = 'gray';

        if(rowData.bookType !== undefined) {
            baseColor = rowData.bookType.color;
        }

        // 내가 예약한 회의실은 리스트의 시간부분을 다른색으로 해서 구별
        var isMineColor = 'cornflowerblue';
        if(rowData.userID === fbDB.getAuthUid()) {
            // isMine = <Icon name='cube' size={15} color={'blue'} />
            isMineColor = 'firebrick';
        }

        var memo = rowData.bookMemo;
        if(memo === undefined) {
            memo = '회의실이 비어 있으니 예약이 가능합니다.'
        }

        console.log('_renderTimeTable check groupID: ' + rowData.groupID);

        return (
            <TouchableHighlight
                underlayColor={'transparent'}
                onPress={() => this.onBookPress(rowData)}>

                <View style={styles.rowContainer}>
                    <View style={[styles.rowTimeContainer, {backgroundColor: isMineColor}]}>
                        <Text style={styles.rowTimeText}>{rowData.hour}</Text>
                    </View>
                    <View style={[styles.rowMemoContainer, {backgroundColor: baseColor}]}>
                        <Text
                            numberOfLines={2}
                            ellipsizeMode='tail'
                            style={styles.rowMemoTextTitle}>{memo}</Text>
                        <Text style={styles.rowMemoTextUser}>{rowData.userEmail}</Text>
                    </View>
                </View>

            </TouchableHighlight>


        );
    }

    _renderSeparator(sectionID: number, rowID: number, adjacentRowHighlighted: bool) {
        return (
            <View
                key={`${sectionID}-${rowID}`}
                style={{
                    height: adjacentRowHighlighted ? 4 : 1,
                    backgroundColor: adjacentRowHighlighted ? '#3B5998' : 'transparent',
                }}
                />
        );
    }

    render() {
        var _scrollView: ScrollView;

        return (
            <View style={styles.container}>

                <Loading
                    animating={this.state.showProgress}
                    opacity={1.0}/>

                <NaviBar
                    zIndex={1}
                    naviTitle={`${this.props.selectFloor}층-${this.props.selectRoomData.roomTitle} 예약현황`}
                    onBackPress={this.onBackPress} />

                <ParallaxScrollView
                    zIndex={2}
                    style={{paddingTop:40}}
                    backgroundColor="transparent"
                    renderForeground={() =>
                        <View>
                            <CalendarPicker
                                selectedDate={this.state.date}
                                onDateChange={this.onDateChange}
                                onMonthChange={this.onMonthChange}
                                screenWidth={window.width}
                                selectedDayColor={'#5cb2ce'} />
                        </View>
                    }
                    stickyHeaderHeight={stickyHeight}
                    renderStickyHeader={() =>
                        <View style={{ height: stickyHeight, padding: 10, backgroundColor: 'black', opacity: 0.7, }}>
                            <Text style={styles.selectedDate}> 선택 날짜 : { `${this.state.date.getFullYear()} / ${this.state.date.getMonth() + 1} / ${this.state.date.getDate()} ${CommonUtil.getDayOfWeek(this.state.date)}요일` } </Text>
                        </View>
                    }

                    parallaxHeaderHeight={ calendarHeight }>

                    <View style={styles.timeTableContainer}>
                        <ListView
                            dataSource={this.state.dataSource}
                            renderRow={this._renderTimeTable}
                            renderSeparator={this._renderSeparator} />
                    </View>

                </ParallaxScrollView>

            </View>
        )
    }
}

module.exports = MeetingRoomMain;
