import React, { Component } from 'react';
import {
    View,
    Text,
    Image,
    ListView,
    ScrollView,
    Alert,
    TouchableHighlight,
    TouchableOpacity,
    Dimensions,
    StyleSheet
} from 'react-native';

import CachedImage from 'react-native-cached-image';
import { hardwareBackPress } from 'react-native-back-android';
import ScrollableTabView, { ScrollableTabBar, } from 'react-native-scrollable-tab-view';

import fbDB from '../firebase/Database';

import SecretText from "../consts/SecretText";

import NaviBar from './NaviBar';
import FloorTabBar from './FloorTabBar';
import Loading from "./Loading";

const window = Dimensions.get('window');

// placeholder 기본 이미지
const placeholder = require('../../public/images/placeholder.png');

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },

    listContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    row: {
        // padding: 10,
        alignItems: 'center'
    },

    title: {
        fontSize: 20,
        color: '#333333',
        marginLeft: 10,
    },

    subTitle: {
        fontSize: 12,
        color: '#333333',
        marginLeft: 10,
    },

    blockTitle: {
        fontSize: 12,
        color: 'red',
        marginLeft: 10,
    },

    titleBG: {
        backgroundColor:'lightgrey',
        flexDirection: 'column',
        opacity: 0.6,
        width: window.width / 2,
    },

    tabView: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.01)',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    card: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        width: window.width / 2 - 0.5,
    },

    roomBG: {
        width:window.width / 2,
        height: window.width / 2 * 1.5,
    },
});

var meetingRoomInfo;

class MainFloor extends Component {

    constructor(props) {
        super(props);

        this.state = {
            dataSource : new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
            currentFloor : 0,
            children: [],
            floors: [],
            roomData: [],
            showProgress: true,
        };

        this.handleChangeTab = this.handleChangeTab.bind(this);
        this.onPressFloor = this.onPressFloor.bind(this);
        this.getFloor = this.getFloor.bind(this);
        this.getRoomList = this.getRoomList.bind(this);
        this.renderRoom = this.renderRoom.bind(this);
        this.renderMainFloor = this.renderMainFloor.bind(this);
        this.onBackPress = this.onBackPress.bind(this);
    }

    componentWillMount() {
        meetingRoomInfo = fbDB.getAllMeetingRoom();
    }

    componentDidMount() {
        this.getFloor();
    }

    onBackPress() {
        this.props.navigator.pop();
    }

    getFloor() {
        var floorLists = [];
        var roomLists = [];

        // console.log("MainFloor getFloor: " + Object.values(meetingRoomInfo));

        for(key in meetingRoomInfo) {
            // console.log("MainFloor floor: " + key);
            // console.log("MainFloor meetingRoomInfo key: " + key);
            floorLists.push(key);
        }

        this.setState({
            showProgress: true,
            floors: floorLists,
            currentFloor: floorLists[0]
        }, () => {
            this.getRoomList(this.state.currentFloor);
        });
    }

    getRoomList(currentFloor) {
        try {
            // console.log("MainFloor currentFloor: " + currentFloor);

            var roomDatas = meetingRoomInfo[currentFloor];
            // console.log("MainFloor getRoomList roomDatas: " + roomDatas);

            var roomLists = [];

            for(roomKey in roomDatas) {
                var roomInfo = roomDatas[roomKey];

                var rooms = roomLists.slice();
                rooms.push({
                    roomID: roomKey,
                    roomTitle: roomInfo.name,
                    imgURL: roomInfo.imgURL,
                    available: roomInfo.available,
                    availableMax: roomInfo.availableMax,
                    availableMessage: roomInfo.availableMessage,
                });

                roomLists = rooms;
            }

            this.setState({
                currentFloor: currentFloor,
                roomData: roomLists,
                dataSource: this.state.dataSource.cloneWithRows(roomLists),
                showProgress: false,
            });

        } catch (error) {
            console.log(error);
        }
    }

    onPressFloor = (roomData) => {
        // console.log("roomData: " + roomData);

        if(!roomData.available) {
            Alert.alert(
                '예약불가',
                roomData.availableMessage,
                [
                    { text: '확인' },
                ],
                { cancelable: false }
            )

            return;
        }

        this.props.navigator.push({
            name: 'MeetingRoomMain',
            selectRoomData: roomData,
            selectFloor: this.state.currentFloor,
        });
    }

    // i가 객체로 만들어져 있어 i.i로 해야 position을 가져올수 있다.
    handleChangeTab = (i, ref, from,) => {
        try {
            this.getRoomList(this.state.floors[i.i]);
        } catch (error) {
            console.log("handleChangeTab: " + error)
        }
    }

    renderRoom(rowData) {
        var blockView;

        if(!rowData.available) {
            blockView = <Text style={styles.blockTitle}>(예약 불가능)</Text>
        }

        return <TouchableHighlight
            style={styles.tabView}
            underlayColor={'transparent'}
            onPress={() => this.onPressFloor(rowData)}>
            <View style={styles.card}>
                <CachedImage
                    source={{
                        uri: rowData.imgURL
                    }}
                    style={styles.roomBG}
                    defaultSource={placeholder}
                />
                <View style={styles.titleBG}>
                    <View style={{flexDirection: 'row'}}>
                        <Text style={styles.subTitle}>{`${rowData.availableMax}명 수용가능`}</Text>
                        { blockView }
                    </View>

                    <Text style={styles.title}>{rowData.roomTitle}</Text>

                </View>
            </View>
        </TouchableHighlight>
    }

    render() {
        return this.renderMainFloor();
    }

    renderMainFloor() {

        return (
            <View style={styles.container} >
                <NaviBar
                    naviTitle={SecretText.MEETINGROOM_LIST}
                    onBackPress={this.onBackPress} />

                <Loading
                    animating={this.state.showProgress}/>

                <ScrollableTabView
                    initialPage={0}
                    renderTabBar={() => <FloorTabBar goToPage={this.goToPage} />}
                    onChangeTab={this.handleChangeTab}
                    >

                    {this.state.floors.map((floor, i) => {
                        return <View style={{flex:1}} tabLabel={`${floor}층`} key={`${floor}-${i}`}>
                            <ListView
                                contentContainerStyle={styles.listContainer}
                                dataSource={this.state.dataSource}
                                enableEmptySections={true}
                                renderRow={(rowData) =>
                                    this.renderRoom(rowData)
                                }
                                />
                        </View>
                    })}
                </ScrollableTabView>

            </View>
        )

    }
}

const handleBackButtonPress = ({ navigator }) => {
    navigator.pop();
    return true;
};

module.exports = hardwareBackPress(MainFloor, handleBackButtonPress);
