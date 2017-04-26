import * as firebase from "firebase";
import CommonConst from "../consts/CommonConst";
import CommonUtil from "../util/CommonUtil";
import MyBookingModel from "../models/MyBookingModel";

let rootMeetingRoom = "MeetingRoom/";
let rootUserData = "UserData/";

let rootBookData = "BookData/";
let rootGroupData = "GroupData/";
let rootUserInfo = "UserInfo/";
let rootNotificationGroup = "NotificationGroup/";

var ALL_MEETINGROOM = {};

class Database {

    static getAllMeetingRoom() {
        return ALL_MEETINGROOM;
    }

    static getBaseRef() {
        return firebase.database().ref();
    }

    static getAuthUid() {
        return firebase.auth().currentUser.uid;
    }

    static getAuthEmail() {
        return firebase.auth().currentUser.email;
    }

    // 유저 리스트 가져오기
    static getAuthUserList(callback) {

        try {
            console.log("call getAuthUserList");

            firebase.database().ref().child(rootUserData).once('value', (snapshot) => {

                var userLists = [];

                snapshot.forEach((child) => {

                    var users = userLists.slice()
                    users.push({
                        userID: child.key,
                        userEmail: child.val().userEmail,
                        userGroup: child.val().userGroup,
                        userName: child.val().userName,
                        isChecked: false
                    })

                    userLists = users;
                });

                callback(userLists);
            })

            console.log("end getAuthUserList");
        } catch(error) {
            console.log("error getAuthUserList: " + error.toString());
        }
    }

    // 층목록 가져오기
    static listenFloorList(callback) {

        firebase.database().ref().child(rootMeetingRoom).on('value', (snapshot) => {

            var floorLists = [];

            snapshot.forEach((child) => {

                console.log("listenFloorList child: " + child.key);

                var floors = floorLists.slice()
                floors.push({floor: child.key})
                floorLists = floors;
            });

            callback(floorLists);
        })
    }

    // 회의실 목록 가져오기
    static listenMeetingRoomList(floor, callback) {

        let roomListPath = rootMeetingRoom + floor;
        console.log("listenMeetingRoomList roomListPath: " + roomListPath);

        firebase.database().ref().child(roomListPath).on('value', (snapshot) => {
            var roomLists = [];

            snapshot.forEach((child) => {

                console.log("listenMeetingRoomList child: " + child);

                var rooms = roomLists.slice()
                rooms.push({
                    roomID: child.key,
                    roomTitle: child.val().name,
                    roomImg: child.val().img
                });

                roomLists = rooms;
            });

            callback(roomLists);
        });
    }

    // 회의실 목록 통째로 가져오기
    static getAllMeetingRoomList() {
        firebase.database().ref().child(rootMeetingRoom).once('value', (snapshot) => {
            ALL_MEETINGROOM = JSON.parse(JSON.stringify(snapshot));

            console.log("getAllMeetingRoomList: " + Object.values(ALL_MEETINGROOM));
        });
    }

    // 회의실 정보 가져오기
    static listenMeetingRoomInfo(floor, roomID, callback) {

        let roomInfoPath = `${rootMeetingRoom}${floor}/${roomID}`;
        console.log("listenMeetingRoomInfo roomInfoPath: " + roomInfoPath);

        firebase.database().ref().child(roomInfoPath).once('value', (snapshot) => {

            console.log("listenMeetingRoomInfo snapshot: " + Object.values(snapshot));

            var roomInfo = {};

            roomInfo.img = snapshot.val().img;
            roomInfo.name = snapshot.val().name;

            callback(roomInfo);
        });
    }

    // 층수, 회의실 유효한지 체크
    static checkValidRoomInfo(floor, roomID, callback) {

        var childPath;

        // 층수 확인
        if(roomID === null) {
            childPath = `${rootMeetingRoom}${floor}`;
        }
        // 회의실 확인
        else {
            childPath = `${rootMeetingRoom}${floor}/${roomID}`;
        }

        firebase.database().ref().child(childPath).once("value", (snapshot) => {
            var userData = snapshot.val();
            if (userData) {

                callback(true);
                return;
            }

            callback(false);
        });
    }

    // 해당 예약이 요청한 유저와 일치하는지 확인
    static checkMatchUser(selectDateAry, floor, roomID, beginTime, callback) {
        /*
        ex) BookData/20170308/12/A/9/userID =>
        */
        console.log("call checkMatchUser");

        var isMatched = true;

        // map은 break가 안먹혀서 for문으로 교체 - 중복되는 예약 찾으면 바로 취소 처리
        for(i = 0; i<selectDateAry.length; i ++) {
            var yymmdd = selectDateAry[i];

            let bookListBasePath = `${rootBookData}${yymmdd}/${floor}/${roomID}/${beginTime}`;
            let bookListCheckPath = `${bookListBasePath}/userID`;
            console.log("checkMatchUser bookListBasePath: " + bookListBasePath);

            firebase.database().ref().child(bookListCheckPath).once("value", (snapshot) => {
                var userID = snapshot.val();
                if (userID !== this.getAuthUid()) {
                    isMatched = false;
                }
            });

            console.log('isMatched: ' + isMatched);
            if(!isMatched)
                break;
        }

        callback(isMatched);
    }

    // 해당 예약이 요청한 유저와 일치하는지 확인 후 삭제 처리
    static checkAndDeleteMatchUser(seletedDates, seletedUsers, isRemoveAll, callback) {
        try {
            /*
            ex) BookData/20170308/12/A/9/userID =>
            */
            var isSuccess = true;

            console.log("checkAndDeleteMatchUser seletedDates: " + seletedDates + " isRemoveAll: " + isRemoveAll ? "true" : "false");

            // userData 그룹과 notification 그룹 데이터 삭제하기 위한 경로 배열 선언
            var childPathAry = [];
            var memberAry = [];

            console.log(Object.keys(seletedDates));
            // 1. 반복 예약 전체 삭제

            for(var key in seletedDates) {
                var listPath = seletedDates[key];

                childPathAry.push(listPath);

                let bookListCheckPath = `${rootBookData}${listPath}`;
                console.log("checkAndDeleteMatchUser bookListBasePath: " + listPath);

                firebase.database().ref(bookListCheckPath).child("memberInfo/owner").once("value", (snapshot) => {
                    var userID = snapshot.val();
                    if (userID === firebase.auth().currentUser.uid) {
                        // 삭제 처리
                        firebase.database().ref().child(bookListCheckPath).once("value", (removeSnapshot) => {
                            console.log("checkAndDeleteMatchUser removeSnapshot: " + removeSnapshot);

                            if(removeSnapshot.exists()) {
                                firebase.database().ref().child(bookListCheckPath).remove();
                                console.log("call remove");
                            }
                        });
                    } else {
                        console.log("call remove failed");
                        isSuccess = false;

                        callback(isSuccess);
                        return;
                    }
                });
            }

            // Todo 2. 유저별로 예약 삭제 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
            Database.setUserBookingData(childPathAry, seletedUsers, true);

            // Todo 3. NotificationGroup 삭제 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
            Database.setNotificationGroup(childPathAry, seletedUsers, true);

            callback(isSuccess);

        } catch(error) {
            console.log("checkAndDeleteMatchUser error: " + error)
        }

    }


    // Firebase DB /GroupData에 selectedUsers에 멤버 수정
    static updateBookingGroup(groupID, memberObj) {
        try {
            if(groupID === undefined) {
                return;
            }

            let groupIDPath = `${rootGroupData}${groupID}/selectedUsers`;
            console.log("removeBookingGroup groupIDPath: " + groupIDPath);

            // firebase.database().ref().child(groupIDPath).remove();
            firebase.database().ref().child(groupIDPath).once("value", (snapshot) => {

                snapshot.ref.set({
                    owner: memberObj.owner,
                    members: memberObj.members
                });
            });
        } catch(error) {
            console.log("removeAllBookingGroup error: " + error);
        }
    }

    // 반복예약 삭제 후 groupID에 해당하는 리스트 삭제 처리
    static removeAllBookingGroup(groupID) {
        try {
            if(groupID === undefined) {
                return;
            }

            let groupIDPath = `${rootGroupData}${groupID}`;
            console.log("removeBookingGroup groupIDPath: " + groupIDPath);

            // firebase.database().ref().child(groupIDPath).remove();
            firebase.database().ref().child(groupIDPath).once("value", (snapshot) => {
                if(snapshot !== undefined) {
                    snapshot.ref.remove();
                    console.log("removeAllBookingGroup success");
                }
            });
        } catch(error) {
            console.log("removeAllBookingGroup error: " + error);
        }
    }

    // 반복예약 개별 삭제시 groupID와 yymmdd가 일치하는 날짜 삭제 처리
    static removeOneBookingGroup(groupID, yymmdd) {
        try {
            let selectedDatePath = `${rootGroupData}${groupID}/selectedDates`;
            console.log("removeBookingGroup selectedDatePath: " + selectedDatePath);

            firebase.database().ref().child(selectedDatePath).once("value", (snapshot) => {

                snapshot.forEach((child) => {
                    console.log("removeBookingGroup child: " + Object.values(child) + " child.val(): " + child.val() + " child.key: " + child.key);

                    if(child.val() === yymmdd)
                    {
                        if(snapshot.numChildren() < 2) {
                            this.removeAllBookingGroup(groupID);
                        }

                        // 해당하는 아이디 다이렉트로 삭제
                        child.ref.remove();
                        console.log("removeOneBookingGroup success");
                    }
                });
            });

            let selectedTimesPath = `${rootGroupData}${groupID}/selectedTimes`;
            console.log("removeBookingGroup selectedTimesPath: " + selectedTimesPath);

            firebase.database().ref().child(selectedTimesPath).once("value", (snapshot) => {

                snapshot.forEach((child) => {
                    console.log("removeBookingGroup child: " + Object.values(child) + " child.val(): " + child.val() + " child.key: " + child.key);

                    var times = child.val();
                    var tmpTime = times.substring(0,8);

                    if(tmpTime === yymmdd)
                    {
                        if(snapshot.numChildren() < 2) {
                            this.removeAllBookingGroup(groupID);
                        }

                        // 해당하는 아이디 다이렉트로 삭제
                        child.ref.remove();
                        console.log("removeOneBookingGroup success");
                    }
                });
            });

        } catch(error) {
            console.log("removeOneBookingGroup error: " + error);
        }
    }

    // 반복 예약시 해당 날짜와 시간이 비어있는지 체크
    static isPossibleBooking(selectDateAry, floor, roomID, beginTime, callback) {
        var isPossible = true;

        // map은 break가 안먹혀서 for문으로 교체 - 중복되는 예약 찾으면 바로 취소 처리
        for(i = 0; i < selectDateAry.length; i ++) {
            var yymmdd = selectDateAry[i];

            let timeCheckPath = `${rootBookData}${yymmdd}/${floor}/${roomID}/${beginTime}`;

            firebase.database().ref().child(timeCheckPath).once("value", (snapshot) => {
                var bookingData = snapshot.val();

                if (bookingData) {
                    console.log('isPossibleBooking failed timeCheckPath: ' + timeCheckPath);

                    isPossible = false;
                }
            });

            console.log('isPossible: ' + isPossible);
            if(!isPossible)
                break;
        }

        callback(isPossible);
    }

    // 회의실 예약 하기
    static listenWriteBook(selectDateAry, memberObj, floor, roomID, beginTime, endTime, repeatType, bookType, bookMemo, callback) {

        try {
            var groupID = `${floor}_${roomID}_${beginTime}_${repeatType.id}_${bookType.id}_${firebase.auth().currentUser.uid}_${new Date().getTime()}`;
            console.log("listenWriteBook groupID: " + groupID);

            // 유저 예약현황에 기록할 경로 추가
            var childPathAry = [];

            selectDateAry.map ((yymmdd) => {
                console.log('listenWriteBook yymmdd: ' + yymmdd + ' floor: ' + floor + ' roomID: ' + roomID + ' beginTime: ' + beginTime + ' endTime: ' + endTime + ' repeatType: ' + repeatType + ' bookType: ' + bookType + ' bookMemo: ' + bookMemo);
                childPathAry.push(`${yymmdd}/${floor}/${roomID}/${beginTime}`);

                /*
                ex) BookData/20170308/12/A/9 =>
                userID      : 예약자 ID
                userEmail   : 예약자 이메일
                beginTime   : 회의 시작 시간
                endTime     : 회의 종료 시간
                modifyDate  : 마지막 수정 날짜
                bookMemo    : 간단 설명
                bookType    : [M:회의, I: 면접, S: 스터디, E: 기타]
                */
                let bookWritePath = `${rootBookData}${yymmdd}/${floor}/${roomID}/${beginTime}`;

                // 한번 예약할때는 groupID 넣지 않음
                if(repeatType.id === "one") {
                    // firebase.database().ref(bookWritePath).push({
                    firebase.database().ref(bookWritePath).set({
                        userID:firebase.auth().currentUser.uid,
                        userEmail:firebase.auth().currentUser.email,
                        groupID: groupID,
                        endTime: endTime,
                        modifyDate: new Date(),
                        bookMemo: bookMemo,
                        repeatType: repeatType,
                        bookType: bookType,
                        memberInfo: memberObj
                    });
                }
                else {
                    // firebase.database().ref(bookWritePath).push({
                    firebase.database().ref(bookWritePath).set({
                        userID:firebase.auth().currentUser.uid,
                        userEmail:firebase.auth().currentUser.email,
                        groupID: groupID,
                        endTime: endTime,
                        modifyDate: new Date(),
                        bookMemo: bookMemo,
                        repeatType: repeatType,
                        bookType: bookType,
                        memberInfo: memberObj
                    });
                }

            });

            console.log("listenWriteBook selectDateAry: " + selectDateAry + " memberObj: " + memberObj + " childPathAry: " + childPathAry);

            // 1. 그룹 데이터 만들기 - (백그라운드 작업)
            Database.setGroupData(groupID, selectDateAry, memberObj, childPathAry);

            // 2. 유저별로 예약 생성하기 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
            Database.setUserBookingData(childPathAry, memberObj, false);

            // 3. NotificationGroup 생성하기 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
            Database.setNotificationGroup(childPathAry, memberObj, false);

            callback(true);

        } catch (error) {
            console.log('listenWriteBook error: ' + error.toString())

            callback(false);
        }
    }

    // 회의실 수정 하기
    static listenUpdateBook(bookingType, selectDateAry, originMemberObj, memberObj, floor, roomID, beginTime, endTime, repeatType, bookType, bookMemo, groupID, callback) {
        /*
        ex) BookData/20170308/12/A/9 =>
        userID      : 예약자 ID
        userEmail   : 예약자 이메일
        beginTime   : 회의 시작 시간
        endTime     : 회의 종료 시간
        modifyDate  : 마지막 수정 날짜
        bookMemo    : 간단 설명
        bookType    : [M:회의, I: 면접, S: 스터디, E: 기타]
        */
        try {

            // 반복 예약중에서 하나만 수정
            if(bookingType === CommonConst.BOOKING_TYPE.type_update_one) {

                var yymmdd = selectDateAry[0];

                // 사용자 변경 유무 체크
                if(originMemberObj.owenr === memberObj.owenr) {

                    console.log("setUserBookingData originMemberObj.members: " + originMemberObj.members);
                    if(originMemberObj.members !== undefined)  {
                        // 유저 정보 전체 갯수
                        var allCount = originMemberObj.members.length;
                        var newCount = memberObj.members.length;

                        // 기존 유저수와 다르면 무조건 '예약/노티/마이페이지' 유저 업데이트 진행
                        if(allCount === newCount) {
                            // 유저 매칭 갯수
                            var checkCount = 0;

                            for(var i = 0; i < allCount; i++) {
                                var checkOriginUserID = originMemberObj.members[i].userID;

                                for(var k = 0; k < newCount; k++) {
                                    var checkNewUserID = memberObj.members[k].userID;

                                    if(checkOriginUserID === checkNewUserID) {
                                        checkCount ++;
                                    }
                                }
                            }

                            if(allCount === checkCount) {
                                console.log("유저 변경 없음")
                                callback(true);

                                return;
                            }
                        }
                    }
                    console.log("유저 변경");

                    // 1. 기존 예약 수정및 삭제 처리
                    var childPathAry = [];
                    var childPath = `${yymmdd}/${floor}/${roomID}/${beginTime}`

                    childPathAry.push(childPath);
                    // 1-1. 기존 예약에서 해당 유저들 노티/마이페이지 삭제
                    if(originMemberObj.members !== undefined) {

                        // 1-1-1. 변경되는 유저 예약 삭제 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
                        Database.setUserBookingDelete(childPathAry, originMemberObj);

                        // 1-1-2. 기존 NotificationGroup 삭제 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
                        Database.setNotificationGroup(childPathAry, originMemberObj, true);
                    }

                    // 1-2. 기존 반복예약에서 개별 수정되는 yymmdd를 삭제
                    Database.removeOneBookingGroup(groupID, yymmdd);

                    // 2. 새로운 GroupID 생성
                    var groupID = `${floor}_${roomID}_${beginTime}_${repeatType.id}_${bookType.id}_${firebase.auth().currentUser.uid}_${new Date().getTime()}`;

                    // 2-1. 새로생성된 GroupID로 변경
                    let bookWritePath = `${rootBookData}${yymmdd}/${floor}/${roomID}/${beginTime}`;
                    firebase.database().ref(bookWritePath).set({
                        userID:firebase.auth().currentUser.uid,
                        userEmail:firebase.auth().currentUser.email,
                        groupID: groupID,
                        beginTime: beginTime,
                        endTime: endTime,
                        modifyDate: new Date(),
                        bookMemo: bookMemo,
                        bookType: bookType,
                        repeatType: repeatType,
                        memberInfo: memberObj,
                    });

                    // 3. 새로운 예약이나 마찬가지이므로 해당 유저들의 예약/노티/마이페이지 새로 생성
                    // 3-1. 그룹 데이터 만들기 - (백그라운드 작업)
                    Database.setGroupData(groupID, selectDateAry, memberObj, childPathAry);

                    // 3-2. 유저별로 예약 생성하기 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
                    Database.setUserBookingData(childPathAry, memberObj, false);

                    // 3-3. NotificationGroup 생성하기 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
                    Database.setNotificationGroup(childPathAry, memberObj, false);
                }

            } else {
                selectDateAry.map ((yymmdd) => {
                    console.log('listenWriteBook yymmdd: ' + yymmdd + ' floor: ' + floor + ' roomID: ' + roomID + ' beginTime: ' + beginTime + ' endTime: ' + endTime + ' repeatType: ' + repeatType + ' bookType: ' + bookType + ' bookMemo: ' + bookMemo);

                    let bookWritePath = `${rootBookData}${yymmdd}/${floor}/${roomID}/${beginTime}`;

                    // firebase.database().ref(bookWritePath).push({
                    firebase.database().ref(bookWritePath).set({
                        userID:firebase.auth().currentUser.uid,
                        userEmail:firebase.auth().currentUser.email,
                        groupID: groupID,
                        beginTime: beginTime,
                        endTime: endTime,
                        modifyDate: new Date(),
                        bookMemo: bookMemo,
                        bookType: bookType,
                        repeatType: repeatType,
                        memberInfo: memberObj,
                    });

                    if(originMemberObj.owenr === memberObj.owenr) {

                        console.log("setUserBookingData originMemberObj.members: " + originMemberObj.members);
                        if(originMemberObj.members !== undefined)  {
                            // 유저 정보 전체 갯수
                            var allCount = originMemberObj.members.length;
                            var newCount = memberObj.members.length;

                            // 기존 유저수와 다르면 무조건 '예약/노티/마이페이지' 유저 업데이트 진행
                            if(allCount === newCount) {
                                // 유저 매칭 갯수
                                var checkCount = 0;

                                for(var i = 0; i < allCount; i++) {
                                    var checkOriginUserID = originMemberObj.members[i].userID;

                                    for(var k = 0; k < newCount; k++) {
                                        var checkNewUserID = memberObj.members[k].userID;

                                        if(checkOriginUserID === checkNewUserID) {
                                            checkCount ++;
                                        }
                                    }
                                }

                                if(allCount === checkCount) {
                                    console.log("유저 변경 없음")
                                    callback(true);

                                    return;
                                }
                            }
                        }
                        console.log("유저 변경");

                        // GroupData 멤버 정보 변경
                        Database.updateBookingGroup(groupID, memberObj);

                        var childPathAry = [];
                        var childPath = `${yymmdd}/${floor}/${roomID}/${beginTime}`

                        childPathAry.push(childPath);

                        if(originMemberObj.members !== undefined) {
                            // Todo 2. 유저별로 예약 삭제 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
                            Database.setUserBookingData(childPathAry, originMemberObj, true);

                            // Todo 3. NotificationGroup 삭제 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
                            Database.setNotificationGroup(childPathAry, originMemberObj, true);
                        }

                        // Todo 4. 유저별 예약현황, 노티피케이션 그룹 재생성
                        // 2. 유저별로 예약 생성하기 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
                        Database.setUserBookingData(childPathAry, memberObj, false);

                        // Todo 3. NotificationGroup 생성하기 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
                        Database.setNotificationGroup(childPathAry, memberObj, false);
                    }

                })
            }

            callback(true);

        } catch (error) {
            console.log('listenUpdateBook error: ' + error.toString())

            callback(false);
        }
    }


    // 예약 리스트 조회 - 현재날짜, 층, 회의실ID에 해당하는 예약 리스트 가져오기
    static listenDayBookList(yymmdd, floor, roomID, callback) {

        /*
        ex) BookData/20170308/12/A/9 =>
        userID      : 예약자 ID
        beginTime   : 회의 시작 시간
        endTime     : 회의 종료 시간
        modifyDate  : 마지막 수정 날짜
        bookMemo    : 간단 설명
        bookType    : [M:회의, I: 면접, S: 스터디, E: 기타]
        */
        let bookListPath = `${rootBookData}${yymmdd}/${floor}/${roomID}`;
        console.log("listenDayBookList bookListPath: " + bookListPath);

        firebase.database().ref().child(bookListPath).on('value', (snapshot) => {
            var bookLists = [];

            snapshot.forEach((child) => {

                console.log("listenDayBookList child: " + Object.values(child));

                var books = bookLists.slice()
                books.push({
                    userID: child.val().userID,
                    userEmail: child.val().userEmail,
                    groupID: child.val().groupID,
                    beginTime: child.key,
                    endTime: child.val().endTime,
                    modifyDate: child.val().modifyDate,
                    bookMemo: child.val().bookMemo,
                    bookType: child.val().bookType,
                    repeatType: child.val().repeatType,
                    memberInfo: child.val().memberInfo,
                });

                bookLists = books;
            });

            callback(bookLists);
        });
    }

    static searchGroupId(groupID, callback) {
        try {
            let groupDataPath = `${rootGroupData}${groupID}`;

            firebase.database().ref().child(groupDataPath).once('value', function(snapshot) {
                callback(JSON.parse(JSON.stringify(snapshot)));
            });

        } catch (error) {
            console.log("searchGroupId error: " + error);
            callback(undefined);
        }
    }

    // 반복 예약시 그룹핑, 예약 인덱스로 사용
    static setGroupData(groupID, selectDateAry, memberObj, selectTimeAry) {
        try {

            let groupWritePath = `${rootGroupData}${groupID}`;

            firebase.database().ref(groupWritePath).set({
                selectedDates: selectDateAry,
                selectedUsers: memberObj,
                selectedTimes: selectTimeAry,

            });
        } catch (error) {
            console.log('setGroupData error: ' + error.toString())
        }
    }


    // 예약시 해당 userID 별로 회의시간 path 기록하기(계속 추가됨)
    static setUserBookingData(childPathAry, memberObj, isRemove) {
        try {

            var memberAry = [];

            memberAry.push(memberObj.owner);
            if(memberObj.members !== undefined) {
                for(var key in memberObj.members) {
                    memberAry.push(memberObj.members[key]);
                }
            }

            console.log("setUserBookingData childPathAry: " + childPathAry);
            console.log("setUserBookingData memberAry: " + memberAry);

            // 유저별로 회의정보 추가하기(userID/yymmdd/floor/roomID/beginTime 형태)
            memberAry.map( (uid)=> {
                if(typeof uid !== 'string') {
                    return;
                }

                console.log("setUserBookingData memberAry map uid: " + uid);
                var userInfoPath = `${rootUserInfo}${uid}`;

                childPathAry.map( (childPath)=> {
                    console.log("setUserBookingData childPathAry map childPath: " + childPath);

                    // 삭제
                    if(isRemove) {
                        firebase.database().ref().child(`${userInfoPath}/${childPath}`).remove();
                    }
                    // 생성
                    else {
                        // firebase.database().ref(userInfoPath).push(childPath);
                        firebase.database().ref().child(`${userInfoPath}/${childPath}`).push('');
                    }
                });
            });

        } catch (error) {
            console.log('setUserBookingData error: ' + error.toString())
        }
    }

    // 반복예약 개별 수정시만 사용!! 해당 userID 별(owner 제외) 회의시간 path 기록하기 삭제
    static setUserBookingDelete(childPathAry, memberObj) {
        try {

            var memberAry = [];

            if(memberObj.members !== undefined) {
                for(var key in memberObj.members) {
                    memberAry.push(memberObj.members[key]);
                }
            }

            console.log("setUserBookingDelete childPathAry: " + childPathAry);
            console.log("setUserBookingDelete memberAry: " + memberAry);

            // 유저별로 회의정보 삭제하기(userID/yymmdd/floor/roomID/beginTime 형태)
            memberAry.map( (uid)=> {
                if(typeof uid !== 'string') {
                    return;
                }

                console.log("setUserBookingDelete memberAry map uid: " + uid);
                var userInfoPath = `${rootUserInfo}${uid}`;

                childPathAry.map( (childPath)=> {
                    console.log("setUserBookingDelete childPathAry map childPath: " + childPath);
                    firebase.database().ref().child(`${userInfoPath}/${childPath}`).remove();
                });
            });

        } catch (error) {
            console.log('setUserBookingDelete error: ' + error.toString())
        }
    }

    // 오늘 날짜 이후 기준으로 내 예약 현황 가져오기
    static getMyBooking(callback) {
        try {
            console.log("call getMyBooking");

            let myUid = Database.getAuthUid();
            let today = CommonUtil.getTodayYYMMDD();

            let userDataPath = `${rootUserInfo}${myUid}`;
            console.log("getMyBooking userDataPath: " + userDataPath);

            var userDataRef = firebase.database().ref(userDataPath);

            // 내 예약 리스트를 담을 배열
            // var myBooks = [];

            userDataRef.orderByKey().startAt(today).on("value", function(snapshot) {

                // BookingModel을 만들어서 재활용
                var tmpBookingModel = CommonUtil.cloneObject(MyBookingModel);
                tmpBookingModel.setUserID(snapshot.key).setSubObject(snapshot);

                callback(tmpBookingModel);
            });

            // // === Firebase .on으로 대기 child가 추가,삭제 이벤트 수신 대기 (child_added, child_removed) ===
            // // 오늘 날짜 이상의 데이터만 key 기준으로 정렬해서 데이터 가져옴
            // userDataRef.orderByKey().startAt(today).on("child_added", function(snapshot) {
            //
            //     // BookingModel을 만들어서 재활용
            //     var tmpBookingModel = CommonUtil.cloneObject(MyBookingModel);
            //     tmpBookingModel.setYYMMDD(snapshot.key).setSubObject(snapshot);
            //
            //     myBooks.push(tmpBookingModel);
            //     console.log("getMyBooking child_added myBooks: " + JSON.stringify(myBooks));
            //
            //     callback(myBooks);
            // });
            //
            // // callback(myBooks);
            //
            // userDataRef.orderByKey().startAt(today).on("child_removed", function(snapshot) {
            //     // BookingModel을 만들어서 재활용
            //     var tmpBookingModel = CommonUtil.cloneObject(MyBookingModel);
            //     tmpBookingModel.setYYMMDD(snapshot.key).setSubObject(snapshot);
            //
            //     myBooks.push(tmpBookingModel);
            //     console.log("getMyBooking child_removed myBooks: " + JSON.stringify(myBooks));
            //
            //     callback(myBooks);
            // });
            //
            // callback(myBooks);
            // === Firebase .on으로 대기 child가 추가,삭제 이벤트 수신 대기 (child_added, child_removed) ===

        } catch (error) {
            console.log('getMyBooking error: ' + error.toString())
            callback(null);
        }
    }


    // 예약시 Notification을 보낼수 있게 예약별로 멤버 그룹핑
    static setNotificationGroup(bookingPaths, memberObj, isRemove) {
        try {
            bookingPaths.map( (bookingPath)=> {
                let notificationGroup = `${rootNotificationGroup}${bookingPath}`;

                // 삭제
                if(isRemove) {
                    firebase.database().ref().child(notificationGroup).remove();
                }
                // 추가
                else {
                    selectedUsers: memberObj,

                    firebase.database().ref(notificationGroup).set({
                        users: memberObj
                    });
                }

            });

        } catch (error) {
            console.log('setUserBookingData error: ' + error.toString())
        }
    }

    // Notification 보낼 멤버 가져오기
    static getNotificationGroup(bookingPath, callback) {
        try {
            let notificiationGroupPath = `${rootNotificationGroup}${bookingPath}`;

            firebase.database().ref().child(notificiationGroupPath).once("value", (snapshot) => {

                console.log('getUserBookingData snapshot: ' + Object.values(snapshot));
                console.log('getUserBookingData snapshot.val: ' + snapshot.val());

                var userData = snapshot.val();

                if(userData) {
                    var users = [];
                    users.put(userData.owner);
                    users.put(userData.members);

                    callback(users);
                    return;
                }

                callback(null);
            });
        } catch (error) {
            console.log('getUserBookingData error: ' + error.toString())
            callback(null);
        }
    }
}

module.exports = Database;
