import React, { Component } from 'react';
import {
    View,
    Text,
    Image,
    ListView,
    ScrollView,
    TouchableHighlight,
    TouchableOpacity,
    Dimensions,
    StyleSheet
} from 'react-native';

import { hardwareBackPress } from 'react-native-back-android';

import NaviBar from './NaviBar';

import ScrollableTabView, { ScrollableTabBar, } from 'react-native-scrollable-tab-view';
import fbDB from '../firebase/Database';

import FloorTabBar from './FloorTabBar';

import SecretText from "../consts/SecretText";

import Loading from "./Loading";


const window = Dimensions.get('window');

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
        color: 'white',
        marginLeft: 10,
    },

    titleBG: {
        backgroundColor:'gray',
        opacity: 0.6,
        width: window.width / 2 - 22,
    },

    tabView: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.01)',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    card: {
        borderWidth: 1,
        backgroundColor: 'transparent',
        borderColor: 'rgba(0,0,0,0.1)',
        marginTop: 10,
        marginLeft: 12.5,
        width: window.width / 2 - 20,

        shadowColor: '#ccc',
        shadowOffset: { width: 2, height: 2, },
        shadowOpacity: 0.5,
        shadowRadius: 3,

        justifyContent: 'space-around',
    },

    roomBG: {
        width:window.width / 2 - 22,
        height: 210,
    },
});

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
        this.getRoomList = this.getRoomList.bind(this);
        this.renderRoom = this.renderRoom.bind(this);
        this.renderMainFloor = this.renderMainFloor.bind(this);
        this.onBackPress = this.onBackPress.bind(this);
    }

    async componentDidMount() {

        try {
            fbDB.listenFloorList((floorLists) => {
                console.log("floorLists: " + floorLists);
                this.setState({
                    floors: floorLists,
                    currentFloor: floorLists[0].floor,
                }, () => {
                    this.getRoomList(this.state.currentFloor);
                });
            });

        } catch (error) {
            console.log(error);
        }
    }

    onBackPress() {
        this.props.navigator.pop();
    }

    async getRoomList(currentFloor) {
        try {

            this.setState({
                showProgress: true,
            }, () => {
                // console.log("call getRoomList currentFloor: " + currentFloor);

                this.setState({
                    currentFloor: currentFloor
                });

                fbDB.listenMeetingRoomList(currentFloor, (roomLists) => {
                    // console.log("callback roomLists: " + roomLists);

                    this.setState({
                        roomData: roomLists,
                        dataSource: this.state.dataSource.cloneWithRows(roomLists),
                        showProgress: false,
                    });
                });
            });

        } catch (error) {
            console.log(error);
        }
    }

    onPressFloor = (roomData) => {
        // console.log("roomData: " + roomData);

        this.props.navigator.push({
            name: 'MeetingRoomMain',
            selectRoomData: roomData,
            selectFloor: this.state.currentFloor,
        });
    }

    // i가 객체로 만들어져 있어 i.i로 해야 position을 가져올수 있다.
    handleChangeTab = (i, ref, from,) => {
        try {
            this.getRoomList(this.state.floors[i.i].floor);
        } catch (error) {
            console.log("handleChangeTab: " + error)
        }
    }

    renderRoom(rowData) {
        // console.log("renderRoom rowData: " + Object.values(rowData));

        var bg;

        switch (rowData.roomTitle) {
            case "광주":
            bg = <Image
                source={require('../../public/images/12_Guangzhou.jpg')}
                style={styles.roomBG}
                />
            break;
            case "상해":
            bg = <Image
                source={require('../../public/images/12_Shanghai.jpg')}
                style={styles.roomBG}
                />
            break;

            case "홍콩":
            bg = <Image
                source={require('../../public/images/12_Hongkong.jpg')}
                style={styles.roomBG}
                />
            break;

            case "심천":
            bg = <Image
                source={require('../../public/images/12_Shenzhen.jpg')}
                style={styles.roomBG}
                />
            break;


            case "두바이":
            bg = <Image
                source={require('../../public/images/13_Dubai.jpg')}
                style={styles.roomBG}
                />
            break;

            case "싱가폴":
            bg = <Image
                source={require('../../public/images/13_Singapore.jpg')}
                style={styles.roomBG}
                />
            break;

            case "상파울로":
            bg = <Image
                source={require('../../public/images/13_Saopaulo.jpg')}
                style={styles.roomBG}
                />
            break;

            case "시드니":
            bg = <Image
                source={require('../../public/images/13_Sydney.jpg')}
                style={styles.roomBG}
                />
            break;

            case "도쿄":
            bg = <Image
                source={require('../../public/images/14_Tokyo.jpg')}
                style={styles.roomBG}
                />
            break;

            case "멕시코시티":
            bg = <Image
                source={require('../../public/images/14_Mexicocity.jpg')}
                style={styles.roomBG}
                />
            break;

            case "쿠알라룸푸르":
            bg = <Image
                source={require('../../public/images/14_Kualalumpur.jpg')}
                style={styles.roomBG}
                />
            break;

            case "성도":
            bg = <Image
                source={require('../../public/images/16_Chengdu.jpg')}
                style={styles.roomBG}
                />
            break;

            case "서안":
            bg = <Image
                source={require('../../public/images/16_Xian.jpg')}
                style={styles.roomBG}
                />
            break;

            case "북경":
            bg = <Image
                source={require('../../public/images/16_Beijing.jpg')}
                style={styles.roomBG}
                />
            break;

            case "심양":
            bg = <Image
                source={require('../../public/images/16_Shenyang.jpg')}
                style={styles.roomBG}
                />
            break;

            case "하얼빈":
            bg = <Image
                source={require('../../public/images/16_Haerbin.jpg')}
                style={styles.roomBG}
                />
            break;

            case "청도":
            bg = <Image
                source={require('../../public/images/16_Qingdao.jpg')}
                style={styles.roomBG}
                />
            break;

            default:

        }

    // console.log("bg: " + bg);

        return <TouchableHighlight
            style={styles.tabView}
            underlayColor={'transparent'}
            onPress={() => this.onPressFloor(rowData)}>
            <View style={styles.card}>
                {bg}
                <View style={styles.titleBG}>
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

                    {this.state.floors.map((floors, i) => {
                        return <View style={{flex:1}} tabLabel={`${floors.floor}층`} key={`${floors.floor}-${i}`}>
                            <ListView
                                contentContainerStyle={styles.listContainer}
                                dataSource={this.state.dataSource}
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

module.exports = MainFloor;
