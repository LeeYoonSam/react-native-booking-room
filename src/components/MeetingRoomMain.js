import React, { Component } from 'react';
import {
    View,
    Text,
    ListView,
    Alert,
    TouchableHighlight,
    Dimensions,
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
        backgroundColor: 'cornflowerblue',
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

class MeetingRoomMain extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ds : new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
            date: new Date(),
            dateStr: CommonUtil.dateToYYMMDD(new Date()),
        };

        this.getBookList = this.getBookList.bind(this);
        this.onDateChange = this.onDateChange.bind(this);
        this.onBookPress = this.onBookPress.bind(this);
        this.onBackPress = this.onBackPress.bind(this);
        this._renderTimeTable = this._renderTimeTable.bind(this);
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

    // 예약 리스트를 가져와서 해당 날짜에 표시해주기
    async getBookList() {

        console.log("getBookList this.state.dateStr: " + this.state.dateStr);
        fixedTimeList = new FIXED_BASETIME;
        tempList = fixedTimeList.getArr();

        console.log("getBookList tempList: " + Object.values(tempList[0]));

        // DB-1. 파이어베이스 DB 조회
        // this.state.date(파싱해야함 yymmdd 형식으로)를 이용해서 데이터 조회
        // firebase ex) listenDayBookList(yymmdd, floor, roomID, callback)
        await fbDB.listenDayBookList(this.state.dateStr, this.props.selectFloor, this.props.selectRoomData.roomID, (bookLists) => {
            bookLists.map((book) => {
                // 9시 부터 시작하기 때문에 -9를 해주면 position 0부터 순차 진행 ex) beginTime === 9 => position: 0,  beginTime === 15 => position: 6
                var bookPosition = book.beginTime - 9;

                // 회의실 시간이 일치하는 리스트에 데이터를 업데이트 해준다.
                var item = tempList[bookPosition];
                item.userID = book.userID;
                item.userEmail = book.userEmail;
                item.beginTime = book.beginTime;
                item.endTime = book.endTime;
                item.bookMemo = book.bookMemo;
                item.bookType = book.bookType;
            });

            // // DB-2. callback에서 전체 시간별 예약 리스트를 가져옴
            this.setState({
                dataSource: this.state.ds.cloneWithRows(tempList)
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
        });
    }

    moveWriteBook = (selectTime) => {
        console.log('selectTime: ' + selectTime);

        // 팝업 띄우기
        this.props.navigator.push({
            name: 'BookRoom',
            selectRoomData: this.props.selectRoomData,
            selectFloor: this.props.selectFloor,
            selectDate: this.state.dateStr,
            selectTime: selectTime,
        });
    }

    onBackPress = () => {
        this.props.navigator.pop();
    }

    _renderTimeTable(rowData) {
        var baseColor = '#c9c9c9';

        if(rowData.bookType !== undefined) {
            baseColor = rowData.bookType.color;
        }

        var isMine;

        if(rowData.userID === fbDB.getAuthUid()) {
            isMine = <Icon name='cube' size={15} color={'blue'} />
        }

        return (
            <TouchableHighlight
                underlayColor={'transparent'}
                onPress={() => this.onBookPress(rowData)}>

                <View style={styles.rowContainer}>

                    {isMine}
                    <View style={styles.rowTimeContainer}>
                        <Text style={styles.rowTimeText}>{rowData.hour}</Text>
                    </View>
                    <View style={[styles.rowMemoContainer, {backgroundColor: baseColor}]}>
                        <Text
                            numberOfLines={2}
                            ellipsizeMode='tail'
                            style={styles.rowMemoTextTitle}>{rowData.bookMemo}</Text>
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
                        <View style={{ height: stickyHeight, padding: 10, backgroundColor: 'gray'}}>
                            <Text style={styles.selectedDate}> Date: { this.state.date.toString() } </Text>
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
