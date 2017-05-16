import React, { Component } from 'react';
import {
    View,
    Text,
    ListView,
    TouchableHighlight,
    Dimensions,
    Platform,
    DeviceEventEmitter,
    AsyncStorage,
    StyleSheet
} from 'react-native';

import { hardwareBackPress, exitApp } from 'react-native-back-android';

import RNBottomSheet from 'react-native-bottom-sheet';
import Icon from 'react-native-vector-icons/FontAwesome';

// import FirebaseClient from "../firebase/FirebaseClient";
import fbDB from '../firebase/Database';

import CommonUtil from '../util/CommonUtil';

import StatusBar from './StatusBar';
import Loading from "./Loading";

import CommonStyle from "../styles/Common.css";
import CommonConst from "../consts/CommonConst";
import SecretText from "../consts/SecretText";

const window = Dimensions.get('window');

const marginAOS = (Platform.OS === 'ios') ? 0 : 20;

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
        // alignItems:'flex-end',      // 가로 정렬
        // justifyContent:'flex-end',  // 세로 정렬
        position: 'absolute',
        marginLeft: window.width - 50, // ListView 위에 위치하고 화면은 가리지 않기위해 마진으로 적용(우하단 위치)
        marginTop: window.height - 50 - marginAOS, // ListView 위에 위치하고 화면은 가리지 않기위해 마진으로 적용(우하단 위치)
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
        return false;
    }

    constructor(props) {
        super(props);

        this.state = {
            ds : new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
            bookingDatas: [],
            placeName: '',
            showProgress: false,
            token: "",
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
        // DeviceEventEmitter add Listener 예약이 추가되면 마이페이지 새로고침
        DeviceEventEmitter.addListener('refreshMyBooking', () => {
            this.getBookingList();
        });

        AsyncStorage.getItem("pushToken").then((token) => {
           this.setState({ token : token}, () => {
               // 파이어베이스 UserData에 token 업데이트
               fbDB.setPushToken(this.state.token);
           });
       }).done();

        this.getBookingList();
    }

    componentWillUnmount() {
        // DeviceEventEmitter remove Listener
        DeviceEventEmitter.removeAllListeners('refreshMyBooking');
    }


    getBookingList() {
        this.setState({
            showProgress: true,
        }, () => {

            var tmpBookingLists = [];

            try {
                fbDB.getMyBooking( (bookingData) => {

                    // 데이터를 가져올때 기존 데이터와 갯수가 같으면 리스트 세팅 안함
                    if(bookingData === undefined || bookingData.booking === null) {
                        this.stopProgress();
                        return;
                    }

                    if(bookingData.booking.length === this.state.bookingDatas.length) {
                        this.stopProgress();
                        return;
                    }

                    var tempList = tmpBookingLists.slice();

                    var bookingObj = bookingData.booking;
                    for(var bookKey in bookingObj) {
                        if(bookingObj.hasOwnProperty(bookKey)) {

                        }
                        // 쓰레기 데이터, 파이어베이스 뒷부분 사용하지 않음.
                        if(bookingObj[bookKey] === undefined) {
                            continue;
                        }

                        var tmpFloor = bookingObj[bookKey];

                        for(var floorKey in tmpFloor) {
                            // 쓰레기 데이터, 파이어베이스 뒷부분 사용하지 않음.
                            if(tmpFloor[floorKey] === undefined) {
                                continue;
                            }

                            var tmpRoom = tmpFloor[floorKey];

                            for(var roomKey in tmpRoom) {

                                // 쓰레기 데이터, 파이어베이스 뒷부분 사용하지 않음.
                                if(tmpRoom[roomKey] === undefined) {
                                    continue;
                                }

                                var tmpTime = tmpRoom[roomKey];
                                // console.log("getBookingList tmpTime: " + JSON.stringify(tmpTime));

                                for(beginTime in tmpTime) {
                                    if(tmpTime.hasOwnProperty(beginTime)) {
                                        var tempBooking = {};
                                        tempBooking.beginTime = beginTime;
                                        tempBooking.yymmdd = bookKey;
                                        tempBooking.floor = floorKey;
                                        tempBooking.roomID = roomKey;
                                        tempBooking.date = `${ bookKey.substr(0,4) }. ${ bookKey.substr(4,2) }. ${ bookKey.substr(6,2) }`;
                                        // console.log("getBookingList tempBooking: " + Object.values(tempBooking));

                                        tempList.push(tempBooking);
                                    }
                                }
                            }
                        }

                        tmpBookingLists = tempList;
                    }
                    this.setPlaceRoom(tmpBookingLists);
                    // this.setDisplay(tmpBookingLists);
                });
            } catch(error) {
                this.setState({
                    showProgress: false,
                });

                console.log("getBookingList error: " + error.toString());
            }
        });
    }

    // 회의실 이름 가져와서 배열 재가공
    setPlaceRoom(tmpBookingLists) {

        var meetingRoomInfo = fbDB.getAllMeetingRoom();
        // console.log("setPlaceRoom meetingRoomInfo: " + Object.values(meetingRoomInfo));

        var reWorkList = [];

        tmpBookingLists.map((book) => {
            var tmpInfo = meetingRoomInfo[book.floor][book.roomID];
            // console.log("setPlaceRoom getBookData: " + Object.values(tmpInfo));

            var placeName = `${book.floor}층 ${tmpInfo.name}`;
            // console.log("setPlaceRoom placeName: " + placeName);

            book.placeName = placeName;

            reWorkList.push(book);
        });

        this.setDisplay(reWorkList);
    }

    setDisplay(tmpBookingLists) {

        // 리스트 세팅
        this.setState({
            dataSource: this.state.ds.cloneWithRows(tmpBookingLists),
            bookingDatas: tmpBookingLists,
        }, ()=> {
            this.stopProgress();
        });
    }

    stopProgress() {
        this.setState({
            showProgress: false
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

                // return placeName;
            });
        } catch (e) {
            console.log("getPlaceName error: " + e.toString());

            var placeName = `${rowData.floor}층`;
            // return placeName;

            return <Text style={styles.rowPlace}>{placeName}</Text>
        }
    }

    renderMyBook(rowData) {
        // console.log("renderMyBook rowData: " + Object.values(rowData));
        // console.log("renderMyBook rowData.key: " + rowData.yymmdd);

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
                        <Text style={styles.rowPlace}>{rowData.placeName}</Text>
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

                <View zIndex={1}
                    style={styles.viewFloatBook}>
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

// const handleBackButtonPress = ({ navigator }) => {
//     navigator.pop();
//     return true;
// };

module.exports = MyBooking;
