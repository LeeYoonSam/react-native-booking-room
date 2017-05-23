import {
    Alert,
    ActionSheetIOS,
    Platform,
    DeviceEventEmitter,
} from 'react-native';

import RNBottomSheet from 'react-native-bottom-sheet';

import fbDB from '../firebase/Database';
import FirebaseClient from "../firebase/FirebaseClient";

import CommonConst from '../consts/CommonConst';

import CommonUtil from './CommonUtil';

var clickedBtn = {};
var repeatDates = {};
var repeatUsers = {};
var propNavigator;
var selectRoomData;
var meetingRoomInfo;
var selectRow;

export default class BookUpdateRemoveUtil {

    constructor(_selectRow, _navigator) {
        selectRow = _selectRow;
        propNavigator = _navigator;

        var meetingRoomInfo = fbDB.getAllMeetingRoom();

        // roomData가 없어서 만들어줌
        var selectMeetingRoom = meetingRoomInfo[selectRow.floor][selectRow.roomID];
        var roomData = {
            roomID: selectRow.roomID,
            roomTitle: selectMeetingRoom.name,
        };

        selectRoomData = roomData;

        // new Date로 Date 형식의 날짜 생성
        var sYear = selectRow.yymmdd.substring(0,4);
        var sMonth = selectRow.yymmdd.substring(4,6);
        var sDay = selectRow.yymmdd.substring(6,8);

        date = new Date(sYear, sMonth -1, sDay);

        this.showActionSheet();
    }

    getActionSheetList = () => {
        var BUTTONS;

        if(selectRow.repeatType.id === "day" || selectRow.repeatType.id === "week") {
            BUTTONS = [
                {name: '예약 전체 수정', action: CommonConst.BOOK_ACTION.updateAll},
                {name: '현재 날짜만 수정', action: CommonConst.BOOK_ACTION.updateOne},
                {name: '예약 전체 삭제', action: CommonConst.BOOK_ACTION.removeAll},
                {name: '현재 날짜만 삭제', action: CommonConst.BOOK_ACTION.removeOne},
                {name: '취소', action: CommonConst.BOOK_ACTION.cancel},
            ];
        } else {
            BUTTONS = [
                {name: '수정', action: CommonConst.BOOK_ACTION.updateOne},
                {name: '삭제', action: CommonConst.BOOK_ACTION.removeOne},
                {name: '취소', action: CommonConst.BOOK_ACTION.cancel},
            ];
        }

        // console.log("getActionSheetList BUTTONS: " + BUTTONS);
        return BUTTONS;
    }

    showActionSheet = () => {

        var BUTTONS = this.getActionSheetList();
        // console.log("showActionSheet BUTTONS: " + BUTTONS);

        var buttonNames = [];

        BUTTONS.map((button) => {
            buttonNames.push(button.name);
        });

        // console.log("showActionSheet BUTTONS.name: " + buttonNames);

        if(Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions({
                options: buttonNames,
                cancelButtonIndex: BUTTONS.length -1,
                // destructiveButtonIndex: DESTRUCTIVE_INDEX,
                tintColor: 'black',
            },
            (buttonIndex) => {
                this.sheetAction(BUTTONS, buttonIndex, selectRow);
            });
        } else {
            RNBottomSheet.showBottomSheetWithOptions({
                options: buttonNames,
                cancelButtonIndex: BUTTONS.length -1,
            }, (buttonIndex) => {
                this.sheetAction(BUTTONS, buttonIndex, selectRow);
            });
        }
    }

    // 액션 시트에서 전달받은 값들로 해당 액션 실행
    sheetAction(BUTTONS, buttonIndex, selectRow) {
        clickedBtn = BUTTONS[buttonIndex];

        console.log("showActionSheet index: " + buttonIndex);
        var buttonAction = BUTTONS[buttonIndex].action;

        switch (buttonAction) {
            case CommonConst.BOOK_ACTION.cancel:
                console.log("취소");
            break;

            // 전체 수정
            case CommonConst.BOOK_ACTION.updateAll:
                console.log("전체 수정");
                // 팝업 띄우기
                propNavigator.push({
                    name: 'BookRoom',
                    selectRoomData: selectRoomData,
                    selectFloor: selectRow.floor,
                    selectDate: selectRow.yymmdd,
                    selectTime: parseInt(selectRow.beginTime),
                    selectData: selectRow,
                    selectOriginDate: date,
                    isUpdate: true,
                    updateType: CommonConst.BOOKING_TYPE.type_update_all,
                });
            break;

            // 개별 수정
            case CommonConst.BOOK_ACTION.updateOne:
                console.log("개별 수정");
                // 팝업 띄우기
                propNavigator.push({
                    name: 'BookRoom',
                    selectRoomData: selectRoomData,
                    selectFloor: selectRow.floor,
                    selectDate: selectRow.yymmdd,
                    selectTime: parseInt(selectRow.beginTime),
                    selectData: selectRow,
                    selectOriginDate: date,
                    isUpdate: true,
                    updateType: CommonConst.BOOKING_TYPE.type_update_one,
                });
            break;

            // 전체 삭제
            case CommonConst.BOOK_ACTION.removeAll:
                console.log("전체 삭제");
                Alert.alert(
                    '',
                    `${clickedBtn.name} 하시겠습니까?`,
                    [
                        {text: '삭제', onPress: () => this.getRepeatList(selectRow, true)},
                        {text: '취소', onPress: () => console.log('취소!')},
                    ])
                break;

            // 개별 삭제
            case CommonConst.BOOK_ACTION.removeOne:
                console.log("개별 삭제");
                Alert.alert(
                    '',
                    `${clickedBtn.name} 하시겠습니까?`,
                    [
                        {text: '삭제', onPress: () => this.getRepeatList(selectRow, false)},
                        {text: '취소', onPress: () => console.log('취소!')},
                    ])
                break;

            default:

                break;
        }
    }

    // 해당 예약의 groupID 찾고 / 완전한 path를 만들어서 미리 세팅 - ex) yymmdd/floor/roomID/beginTime
    // 추후에 '일괄 수정'시 repeatDates와 변경된 내용을 같이 보내서 FB DB에 삽입 처리
    getRepeatList(selectRow, isRemoveAll) {
        try {
            // 전체 삭제
            if(isRemoveAll) {
                console.log("call getRepeatList 전체 삭제" );

                fbDB.searchGroupId(selectRow.groupID, (groupData) => {

                    repeatDates = groupData.selectedTimes;
                    repeatUsers = groupData.selectedUsers;

                    this.fbDeleteBooking(selectRow.groupID, isRemoveAll);
                });
            }
            // 개별 삭제
            else {
                console.log("call getRepeatList 개별 삭제" );

                fbDB.searchGroupId(selectRow.groupID, (groupData) => {

                    var tmpDates = {"0": `${selectRow.yymmdd}/${selectRow.floor}/${selectRow.roomID}/${selectRow.beginTime}`};

                    repeatDates = tmpDates;
                    repeatUsers = groupData.selectedUsers;

                    this.fbDeleteBooking(selectRow.groupID, isRemoveAll);
                });
            }
        } catch (error) {
            console.log(error);
            Alert.alert('오류로 인하여 삭제가 실패 했습니다.');
        }
    }

    fbDeleteBooking = (groupID, isRemoveAll) => {

        // 1. Firebase DB 에서 yymmdd/층/회의실/시간/userID를 비교 / 자신이 쓴 글이면 삭제 처리
        fbDB.checkAndDeleteMatchUser(repeatDates, repeatUsers, isRemoveAll, (isSuccess) => {
            // 삭제 완료
            if(isSuccess) {

                if(groupID !== undefined) {
                    if(isRemoveAll) {
                        fbDB.removeAllBookingGroup(groupID);
                    } else {
                        fbDB.removeOneBookingGroup(groupID, selectRow.yymmdd);
                    }
                }

                // 예약된 멤버들에게 즉시 푸시발송 - 메시지 세팅해야함
                var users = [];
                console.log("start immediate push");
                users.push(repeatUsers.owner);
                if(repeatUsers.members !== undefined) {
                    for(var key in repeatUsers.members) {
                        users.push(repeatUsers.members[key]);
                    }
                }

                console.log("fbDeleteBooking users: " + users);

                // users.push(repeatUsers.owner);
                // // users.push(this.state.memberObj.members);
                //
                // try {
                //     repeatUsers.members.map((userID) => {
                //         console.log(userID);
                //         users.push(userID);
                //     });
                // } catch(error) {
                //     console.log(error);
                // }

                fbDB.getUserPushTokens(users, (tokens) => {
                    console.log("fbDeleteBooking tokens: " + tokens);

                    if(tokens.length > 0) {
                        var pushDate = '';

                        if(repeatDates.length > 1) {
                            var tmpDate = repeatDates[0];
                            var year = tmpDate.substring(0,4);
                            var month = tmpDate.substring(4,6);
                            var day = tmpDate.substring(6,8);

                            var tmpStartDate = `${year}년 ${month}월 ${day}일`

                            tmpDate = repeatDates[repeatDates.length -1];
                            year = tmpDate.substring(0,4);
                            month = tmpDate.substring(4,6);
                            day = tmpDate.substring(6,8);

                            var tmpEndDate = `${year}년 ${month}월 ${day}일`

                            pushDate = `${tmpStartDate}~${tmpEndDate}`;
                        } else {
                            var tmpDate = repeatDates[0];
                            var year = tmpDate.substring(0,4);
                            var month = tmpDate.substring(4,6);
                            var day = tmpDate.substring(6,8);

                            var tmpStartDate = `${year}년 ${month}월 ${day}일`
                            pushDate = `${tmpStartDate}`;
                        }

                        var pushTitle = `${selectRow.floor}층 ${selectRoomData.roomTitle} 예약취소`;
                        var pushContent = `${pushDate} ${selectRow.beginTime}시에 예약이 취소 되었습니다.`;
                        FirebaseClient.sendData(tokens, pushTitle, pushContent);
                    }
                });

                Alert.alert(
                    '',
                    '예약이 삭제 되었습니다.',
                    [
                        { text: '확인', onPress: () =>
                            {
                                // 마이페이지 새로고침이 되지 않아 DeviceEventEmitter 사용해서 호출
                                DeviceEventEmitter.emit('refreshMyBooking', {});
                            }
                        },
                    ],
                    { cancelable: false }
                );

            } else {
                console.log("call failed" );
                Alert.alert('삭제실패. 다시 시도해주세요.');
            }
        });
    }
}
