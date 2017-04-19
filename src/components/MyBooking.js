import React, { Component } from 'react';
import {
    View,
    Text,
    ListView,
    TouchableHighlight,
    Dimensions,
    Platform,
    StyleSheet
} from 'react-native';

import { hardwareBackPress, exitApp } from 'react-native-back-android';

import RNBottomSheet from 'react-native-bottom-sheet';
import Icon from 'react-native-vector-icons/FontAwesome';

import fbDB from '../firebase/Database';
import CommonUtil from '../util/CommonUtil';

import StatusBar from './StatusBar';
import Loading from "./Loading";

import CommonStyle from "../styles/Common.css";
import CommonConst from "../consts/CommonConst";
import SecretText from "../consts/SecretText";

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
        width: 60,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
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

    rowTimeText: {
        fontSize: 24,
        color: 'cornflowerblue',
    },

    rowDate: {
        fontSize: 15,
        color: 'dimgrey',
        marginBottom: 5,
    },

    rowPlace: {
        fontSize: 17,
        color: 'dimgrey',
        fontWeight: 'bold',
    },

    viewFloatBook: {
        marginLeft: window.width - 50, // ListView 위에 위치하고 화면은 가리지 않기위해 마진으로 적용(우하단 위치)
        marginTop: window.height - 50, // ListView 위에 위치하고 화면은 가리지 않기위해 마진으로 적용(우하단 위치)
        alignItems:'flex-end',      // 가로 정렬
        justifyContent:'flex-end',  // 세로 정렬
        position: 'absolute'
    },

    viewMoveBook: {
        width: 40,
        height: 40,
        borderRadius: 40/2,
        backgroundColor: 'blueviolet',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

class MyBooking extends Component {

    handleHardwareBackPress() {
        console.log('* Scene1 back press');
        exitApp();
        return true;
    }

    constructor(props) {
        super(props);

        this.state = {
            ds : new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
            bookingDatas: [],
            showProgress: false,
        };

        this.getBookingList = this.getBookingList.bind(this);
        this.renderMyBook = this.renderMyBook.bind(this);
        this.onClickBook = this.onClickBook.bind(this);
        this.onMoveBook = this.onMoveBook.bind(this);
        this.getPlaceName = this.getPlaceName.bind(this);
    }

    componentWillMount() {
        this.setState({
            dataSource: this.state.ds.cloneWithRows(this.state.bookingDatas)
        });
    }

    componentDidMount() {

        this.getBookingList();
    }

    getBookingList() {
        this.setState({
            showProgress: true,
        }, () => {

            var tmpBookingLists = [];

            try {
                fbDB.getMyBooking( (bookingList) => {
                    // console.log("getBookingList bookingList: " + bookingList);

                    var tempList = tmpBookingLists.slice();

                    bookingList.map((book) => {
                        // console.log("getMyBooking bookingList book: " + Object.values(book));

                        // yymmdd 가져오기
                        var yymmdd = book.yymmdd;

                        var floorKeys = Object.keys(book.booking);
                        // console.log("getMyBooking bookingList keys: " + floorKeys);

                        // 1. for문 돌면서 beginTime 들을 꺼내서 리스트 갯수를 생성(최종 갯수는 beginTime의 갯수와 동일)
                        floorKeys.forEach((keyFloor)=> {
                            var floor = keyFloor;

                            var floorBook = book.booking[floor];
                            // console.log("getMyBooking floorBook: " + Object.values(floorBook));

                            var roomKeys = Object.keys(floorBook);
                            // console.log("getMyBooking roomKeys: " + roomKeys);

                            roomKeys.forEach((keyRoomID)=> {
                                var roomID = keyRoomID;

                                var roomIDBook = floorBook[roomID];
                                // console.log("getMyBooking roomIDBook: " + Object.values(roomIDBook));

                                var timeKeys = Object.keys(roomIDBook);
                                // console.log("getMyBooking timeKeys: " + timeKeys);

                                timeKeys.forEach((beginTime)=> {
                                    var tempBooking = {};

                                    tempBooking.beginTime = beginTime;
                                    tempBooking.yymmdd = yymmdd;
                                    tempBooking.floor = floor;
                                    tempBooking.roomID = roomID;
                                    tempBooking.date = `${ yymmdd.substr(0,4) }. ${ yymmdd.substr(4,2) }. ${ yymmdd.substr(6,2) }`;
                                    // console.log("getMyBooking tempBooking: " + Object.values(tempBooking));

                                    tempList.push(tempBooking);
                                    // console.log("getMyBooking tempList: " + tempList);
                                })
                            });

                        });

                        tmpBookingLists = tempList;

                    });

                    tmpBookingLists = CommonUtil.removeDuplicateAry(tmpBookingLists);

                    // // DB-2. callback에서 전체 시간별 예약 리스트를 가져옴
                    this.setState({
                        dataSource: this.state.ds.cloneWithRows(tmpBookingLists),
                        bookingDatas: bookingList,
                        showProgress: false,
                    });
                });
            } catch(error) {
                this.setState({
                    showProgress: false,
                });

                console.log(error.toString());
            }
        });
    }

    onClickBook(rowData) {

    }

    onMoveBook() {
        this.props.navigator.push({
            name: 'MainFloor'
        });
    }

    getPlaceName(rowData) {
        try {
            fbDB.listenMeetingRoomInfo(rowData.floor, rowData.roomID, (roomInfo)=> {
                var placeName = `${rowData.floor}층 ${roomInfo.name}`;
                console.log("getPlaceName: " + placeName);

                return <Text style={styles.rowPlace}>{placeName}</Text>
            });
        } catch (e) {
            console.log(e.toString());
            return <Text style={styles.rowPlace}>{`${rowData.floor}층`}</Text>
        }
    }

    renderMyBook(rowData) {

        return (
            <TouchableHighlight
                underlayColor={'transparent'}
                onPress={() => this.onClickBook(rowData)}>

                <View style={styles.rowContainer}>
                    <View style={styles.rowTimeContainer}>
                        <Text style={styles.rowTimeText}>{`${rowData.beginTime} 시`}</Text>
                    </View>
                    <View style={styles.rowMemoContainer}>
                        <Text style={styles.rowDate}>{rowData.date}</Text>
                        {this.getPlaceName(rowData)}
                    </View>
                </View>

            </TouchableHighlight>
        );
    }

    checkLists() {
        if(this.state.bookingDatas.length < 1) {
            return (
                <TouchableHighlight
                    underlayColor={'transparent'}
                    onPress={() => this.onMoveBook()}>

                    <View style={{flexDirection: 'column', marginTop:100, alignItems:'center', justifyContent: 'center',}}>
                        <Icon name='book' size={50} color={'blueviolet'} />
                        <Text style={{marginTop: 10}}>{"등록된 예약이 없습니다."}</Text>
                        <Text>{"이곳을 눌러서 예약을 진행해 보세요."}</Text>

                    </View>

                </TouchableHighlight>
            )
        }
        else {
            return (
                <ListView
                    dataSource={this.state.dataSource}
                    enableEmptySections={true}
                    renderRow={this.renderMyBook}
                    renderSeparator={CommonUtil.renderSeparator} />
            )
        }
    }

    render() {
        return (
            <View style={styles.container}>

                <StatusBar title={SecretText.MY_BOOKING} />

                <Loading
                    animating={this.state.showProgress}/>

                {this.checkLists()}

                <View style={styles.viewFloatBook}>
                    <TouchableHighlight
                        underlayColor={'transparent'}
                        onPress={() => this.onMoveBook()}>

                        <View style={styles.viewMoveBook}>
                            <Icon name='book' size={25} color={'white'} />
                        </View>

                    </TouchableHighlight>
                </View>

            </View>
        )
    }
}

const handleBackButtonPress = ({ navigator }) => {
    navigator.pop();
    return true;
};

module.exports = hardwareBackPress(MyBooking, handleBackButtonPress);
