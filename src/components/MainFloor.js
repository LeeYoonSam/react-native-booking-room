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

import StatusBar from './StatusBar';
import ScrollableTabView, { ScrollableTabBar, } from 'react-native-scrollable-tab-view';
import fbDB from '../firebase/Database';

import FloorTabBar from './FloorTabBar';

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
        color: 'gray'
    },

    thumb: {
        width: window.width / 2,
        height: 200
    },

    tab: {
        flex: 1,
        width: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },

    tabs: {
        height: 45,
        flexDirection: 'row',
        paddingTop: 5,
        borderWidth: 1,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },

    tabView: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.01)',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    card: {
        borderWidth: 1,
        backgroundColor: '#fff',
        borderColor: 'rgba(0,0,0,0.1)',
        marginTop: 10,
        marginLeft: 12.5,
        width: window.width / 2 - 20,
        height: 200,

        shadowColor: '#ccc',
        shadowOffset: { width: 2, height: 2, },
        shadowOpacity: 0.5,
        shadowRadius: 3,
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
        };

        this.onPressFloor = this.onPressFloor.bind(this);
        this.getRoomList = this.getRoomList.bind(this);
    }

    async componentDidMount() {
        try {
            fbDB.listenFloorList((floorLists) => {
                console.log("floorLists: " + floorLists);
                this.setState({
                    floors: floorLists,
                    currentFloor: floorLists[0].floor,
                });

                this.getRoomList(this.state.currentFloor);
            });

        } catch (error) {
            console.log(error);
        }
    }

    async getRoomList(currentFloor) {
        try {
            console.log("call getRoomList currentFloor: " + currentFloor);

            this.setState({
                currentFloor: currentFloor
            });

            fbDB.listenMeetingRoomList(currentFloor, (roomLists) => {
                console.log("callback roomLists: " + roomLists);
                // this.setState({
                //     rooms: roomLists
                // });

                this.setState({
                    roomData: roomLists,
                    dataSource: this.state.dataSource.cloneWithRows(roomLists),
                });
            });
        } catch (error) {
            console.log(error);
        }
    }

    onPressFloor = (roomData) => {
        console.log("roomData: " + roomData);

        this.props.navigator.push({
            name: 'MeetingRoomMain',
            selectRoomData: roomData,
            selectFloor: this.state.currentFloor,
        });
    }

    handleChangeTab = (i, ref, from,) => {
        this.getRoomList(this.state.floors[i.i].floor);
    }

    render() {
        return (
            <View style={styles.container} >
                <StatusBar title="Title" />

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
                                    <TouchableHighlight
                                        style={styles.tabView}
                                        underlayColor={'transparent'}
                                        onPress={() => this.onPressFloor(rowData)}>
                                        <View style={styles.card}>
                                            <Text style={styles.title}>{rowData.roomTitle}</Text>
                                        </View>
                                    </TouchableHighlight>
                                }
                                />
                        </View>
                    })}
                </ScrollableTabView>

            </View>
        )}
    }

    module.exports = MainFloor;
