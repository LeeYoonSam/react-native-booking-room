import React, { Component } from 'react';
import {
    View,
    Text,
    ListView,
    TextInput,
    TouchableHighlight,
    Dimensions,
    StyleSheet
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';
import { hardwareBackPress } from 'react-native-back-android';

import NaviBar from './NaviBar';

import fbDB from '../firebase/Database';
import Loading from "./Loading";

const window = Dimensions.get('window');

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },

    name: {
        fontSize: 20,
        color: 'black',
    },

    group: {
        fontSize: 10,
        color: 'gray',
        marginLeft: 5,
        alignSelf: 'flex-end' // baseline 효과 name과 bottom 정렬을 하기 위해 선언
    },

    email: {
        fontSize: 10,
        color: 'gray',
    },

    searchContainer: {
        width: window.width,
        flexDirection: 'column',    // 세로 vertical
        justifyContent: 'center',
        padding: 10,
        height: 60,
    },

    rowContainer: {
        width: window.width,
        flexDirection: 'column',    // 세로 vertical
        alignItems: 'stretch',
        justifyContent: 'space-between',
        padding: 10,
        height: 60,
    },

    nameGroupContainer: {
        flexDirection: 'row',       // 가로 horizontal
        alignItems: 'stretch',
        marginBottom: 5,
    },

    checkBoxContainer: {
        alignItems: 'flex-end',     // 가로 정렬
        justifyContent: 'center',   // 세로 정렬
        height: 60,
        padding: 10
    },

    searchInput: {
      width: window.width - 50,
      height: 40,
      color: '#555555',
      fontSize: 14,
      marginTop: 10,
      marginBottom: 10,
      padding: 10,
      borderColor: 'cornflowerblue',
      borderWidth: 1,
      borderRadius: 4,
      backgroundColor: '#ffffff'
    },
});

// Array.prototype._userSearch = function(keyword) {
//
//     var clone =  this.slice();
//     var searchResult = [];
//
//     for(var i = 0; i < clone.length; i ++) {
//         // 비교문자, 키워드 전부 소문자로 대치해서 비교
//         if(clone[i].userName.toLowerCase().search(keyword.toLowerCase()) !== -1) {
//             searchResult.push(clone[i]);
//         }
//     }
//
//     return searchResult;
// }

// Array.prototype._removeMyUid = function(userID) {
//
//     var clone =  this.slice();
//
//     for(var k = 0; k < clone.length; k ++) {
//         // userID가 일치하는 유저 추가
//         if(clone[k].userID === userID) {
//             this.splice(k, 1);
//         }
//     }
//
//     return this;
// }

class UserSearch extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ds : new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
            users: [],
            selectedUsers: [],
            showProgress: true,
            searchKeyword: '',
        };

        this.onClickRight = this.onClickRight.bind(this);
        this.onUserSelect = this.onUserSelect.bind(this);
        this.onBackPress = this.onBackPress.bind(this);
        this._renderListRow = this._renderListRow.bind(this);
    }

    componentWillMount() {
        this.setState({
            dataSource: this.state.ds.cloneWithRows(this.state.users)
        });
    }

    componentDidMount() {
        this.getUserList();
    }

    onBackPress = () => {
        this.props.navigator.pop();
    }

    // 네비게이션 오른쪽 상단 완료 클릭 이벤트
    onClickRight() {
        this.props.callback(this.state.selectedUsers);
        this.onBackPress();
    }

    // 유저 리스트 가져오기
    async getUserList() {
        try {

            // 로딩시작
            this.setState({
                showProgress: true,
            }, () => {
                // 파이어베이스 디비에서 user 정보를 가져옴
                fbDB.getAuthUserList((userLists) => {

                    // 내 uid를 가져와서 제외 시켜준다.
                    userLists._removeMyUid(fbDB.getAuthUid());

                    if(this.props.selectedUsers !== undefined) {
                        if(this.props.selectedUsers.length > 0) {
                            userLists.map((userInfo) => {
                                for(var i = 0; i < this.props.selectedUsers.length; i ++) {
                                    // 선택된 유저의 UI를 복구하기 위해서 상태 변경
                                    if(userInfo.userID === this.props.selectedUsers[i]) {
                                        userInfo.isChecked = true;

                                        // 선택된 유저 리스트에 추가
                                        this.state.selectedUsers.push(userInfo);
                                    }
                                }
                            });
                        }
                    }

                    // 가져온 유저정보 저장 및 listview 갱신, 로딩 정지
                    this.setState({
                        users: userLists,
                        dataSource: this.state.ds.cloneWithRows(userLists),
                        showProgress: false,
                    });
                });
            });

        } catch (error) {
            console.log(error);
        }
    }

    // 리스트에서 user check 선택 이벤트
    onUserSelect(rowData) {
        try {
            console.log("call onUserSelect");

            // 1. 유저 isChecked 상태값 변경
            rowData.isChecked = !rowData.isChecked;

            // 2. this.state.selectedUsers 에 user정보 저장
            if(rowData.isChecked) {
                this.state.selectedUsers.push(rowData);
            }
            // 체크 해제시 배열에서 제외
            else {
                // 배열의 몇번째 인덱스인지 추출
                var deleteIndex = this.state.selectedUsers.indexOf(rowData);

                // 유효한 인덱스인지 확인
                if(deleteIndex !== -1) {
                    // 해당인덱스 삭제
                    this.state.selectedUsers.splice(deleteIndex, 1);
                }
            }

            // 3. row check 선택/비선택 처리 (UI 적용)
            this.setState({
                dataSource: this.state.ds.cloneWithRows(this.state.users)
            });

        } catch(error) {
            console.log("onUserSelect error: " + error.toString());
        }

    }

    onSearchUser() {
        var searchKeyword = this.state.searchKeyword;

        if(searchKeyword.length > 0) {
            // var filtered = this.state.users.filter(this.searchFilter, searchKeyword);

            var searchResult = this.state.users._userSearch(searchKeyword);

            // 가져온 유저정보 저장 및 listview 갱신, 로딩 정지
            this.setState({
                dataSource: this.state.ds.cloneWithRows(searchResult),
                showProgress: false,
            });
        } else {
            this.setState({
                dataSource: this.state.ds.cloneWithRows(this.state.users),
                showProgress: false,
            });
        }
    }

    // 리스트뷰 row 그리기
    _renderListRow(rowData) {

        var iconColor;

        if(rowData.isChecked) {
            iconColor = 'limegreen';
        } else {
            iconColor = 'gray';
        }

        return (
            <TouchableHighlight
                underlayColor={'transparent'}
                onPress={() => this.onUserSelect(rowData)}>

                <View style={{flex: 1, flexDirection:'row'}}>

                    {/*flex는 바로 비율 조절을 볼수 있고 조정 가능하게 따로 빼서 처리*/}
                    <View style={[styles.rowContainer, {flex: 4}]}>
                        <View style={styles.nameGroupContainer}>
                            <Text style={styles.name}>{rowData.userName}</Text>
                            <Text style={styles.group}>{`(${rowData.userGroup})`}</Text>
                        </View>

                        <Text style={styles.email}>{rowData.userEmail}</Text>
                    </View>

                    {/*flex는 바로 비율 조절을 볼수 있고 조정 가능하게 따로 빼서 처리*/}
                    <View style={[styles.checkBoxContainer, {flex: 1}]}>
                        <Icon name='check-square' size={30} color={iconColor} />
                    </View>
                </View>

            </TouchableHighlight>
        );
    }

    _renderSeparator(sectionID, rowID, adjacentRowHighlighted) {
        return (
            <View
                key={`${sectionID}-${rowID}`}
                    style={{
                        height: 1,
                        backgroundColor: '#DDD',
                    }}
                />
        );
    }

    render() {
        return (
            <View style={styles.container} >

                <Loading
                    animating={this.state.showProgress}/>

                <NaviBar
                    zIndex={1}
                    naviTitle={"사용자 선택"}
                    rightBtnTitle={"완료"}
                    onBackPress={this.onBackPress}
                    onClickRight={this.onClickRight} />

                <View style={{flex:1}}>

                    <View style={{flexDirection:'row'}}>
                        <View style={[styles.searchContainer, {flex: 4}]}>
                            <TextInput
                                ref='keywordInput'
                                style={styles.searchInput}
                                value={this.state.searchKeyword}
                                onChangeText={
                                    (keyword) => {
                                        // 키보드 입력하면 바로 검색 시작
                                        this.setState({searchKeyword: keyword}, () => {
                                            this.onSearchUser();
                                        });
                                    }
                                }
                                placeholder={'사용자를 검색하면 빠르게 찾을 수 있습니다.'}
                                multiline={false} />
                        </View>

                        {/*flex는 바로 비율 조절을 볼수 있고 조정 가능하게 따로 빼서 처리*/}
                        <View style={[styles.checkBoxContainer, {flex: 1}]}>
                            <Icon name='search' size={24} color={'cornflowerblue'} />
                        </View>
                    </View>


                    <View style={{width: window.width, height: 1, backgroundColor: '#DDD'}} />

                    <ListView
                        dataSource={this.state.dataSource}
                        enableEmptySections={true}
                        renderRow={this._renderListRow}
                        renderSeparator={this._renderSeparator} />
                </View>



            </View>
        )
    }
}

const handleBackButtonPress = ({ navigator }) => {
    navigator.pop();
    return true;
};

module.exports = hardwareBackPress(UserSearch, handleBackButtonPress);
