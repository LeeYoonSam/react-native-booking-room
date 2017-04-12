import * as firebase from "firebase";
import CommonConst from "../consts/CommonConst";
import CommonUtil from "../util/CommonUtil";

let rootMeetingRoom = "MeetingRoom/";
let rootUserData = "UserData/";

let rootBookData = "BookData/";
let rootGroupData = "GroupData/";
let rootUserInfo = "UserInfo/";
let rootNotificationGroup = "NotificationGroup/";

var count = 0;

class Database {

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
            console.log("count: " + count);
            count ++;
            /*
            ex) BookData/20170308/12/A/9/userID =>
            */
            var isSuccess = true;

            console.log("checkAndDeleteMatchUser seletedDates: " + Object.values(seletedDates) + "isRemoveAll: " + isRemoveAll);

            // userData 그룹과 notification 그룹 데이터 삭제하기 위한 경로 배열 선언
            var childPathAry = [];
            var memberAry = [];

            // 1. 반복 예약 전체 삭제
            seletedDates.map((listPath) => {

                childPathAry.push(listPath);

                let bookListCheckPath = `${rootBookData}${listPath}/userID`;
                console.log("checkAndDeleteMatchUser bookListBasePath: " + listPath);

                firebase.database().ref().child(bookListCheckPath).once("value", (snapshot) => {
                    var userID = snapshot.val();
                    if (userID === firebase.auth().currentUser.uid) {
                        // 삭제 처리
                        firebase.database().ref().child(listPath).remove();
                        console.log("call remove");
                    } else {
                        console.log("call remove failed");
                        isSuccess = false;

                        callback(isSuccess);
                        return;
                    }
                });
            });

            seletedUsers.map((userID)=> {
                memberAry.push(userID);
            });

            // Todo 2. 유저별로 예약 삭제 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
            Database.setUserBookingData(childPathAry, memberAry, true);

            // Todo 3. NotificationGroup 삭제 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
            Database.setNotificationGroup(childPathAry, memberAry, true);

            callback(isSuccess);

        } catch(error) {
            console.log("checkAndDeleteMatchUser error: " + error)
            callback(false);
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
                        // 해당하는 아이디 다이렉트로 삭제
                        child.ref.remove();
                        console.log("removeOneBookingGroup success");

                        return;
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
                        bookType: bookType
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
                        bookType: bookType
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
    static listenUpdateBook(bookingType, selectDateAry, memberObj, floor, roomID, beginTime, endTime, repeatType, bookType, bookMemo, groupID, callback) {
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
                let bookWritePath = `${rootBookData}${yymmdd}/${floor}/${roomID}/${beginTime}`;

                // firebase.database().ref(bookWritePath).push({
                firebase.database().ref(bookWritePath).set({
                    userID:firebase.auth().currentUser.uid,
                    userEmail:firebase.auth().currentUser.email,
                    groupID: groupID,
                    endTime: endTime,
                    modifyDate: new Date(),
                    bookMemo: bookMemo,
                    repeatType: repeatType,
                    bookType: bookType
                });

                // 1. 백단에서 그룹 매핑 삭제
                Database.removeOneBookingGroup(groupID, yymmdd);

                var childPathAry = [];

                var childPath = `${yymmdd}/${floor}/${roomID}/${beginTime}`
                childPathAry.push(childPath);
                // Todo 2. 유저별로 예약 삭제 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
                Database.setUserBookingData(childPathAry, memberObj, true);

                // Todo 3. NotificationGroup 삭제 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
                Database.setNotificationGroup(childPathAry, memberObj, true);

                // Todo 4. 유저별 예약현황, 노티피케이션 그룹 재생성
                // 2. 유저별로 예약 생성하기 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
                Database.setUserBookingData(childPathAry, memberObj, false);

                // Todo 3. NotificationGroup 생성하기 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
                Database.setNotificationGroup(childPathAry, memberObj, false);

            } else {
                // 이미 그룹아이디가 매칭되어있기 때문에 skip

                // var groupID = `${floor}_${roomID}_${beginTime}_${repeatType.id}_${bookType.id}_${firebase.auth().currentUser.uid}_${new Date().getTime()}`;
                // console.log("listenWriteBook groupID: " + groupID);
                //
                // // 그룹 데이터 만들기 - 백단에서 돌아가므로 콜백은 필요 없음
                // Database.setGroupData(groupID, selectDateAry);

                selectDateAry.map ((yymmdd) => {
                    console.log('listenWriteBook yymmdd: ' + yymmdd + ' floor: ' + floor + ' roomID: ' + roomID + ' beginTime: ' + beginTime + ' endTime: ' + endTime + ' repeatType: ' + repeatType + ' bookType: ' + bookType + ' bookMemo: ' + bookMemo);

                    let bookWritePath = `${rootBookData}${yymmdd}/${floor}/${roomID}/${beginTime}`;

                    // firebase.database().ref(bookWritePath).push({
                    firebase.database().ref(bookWritePath).set({
                        userID:firebase.auth().currentUser.uid,
                        userEmail:firebase.auth().currentUser.email,
                        groupID: tmpGroupID,
                        endTime: endTime,
                        modifyDate: new Date(),
                        bookMemo: bookMemo,
                        repeatType: repeatType,
                        bookType: bookType
                    });


                    // Todo 2. 유저별로 예약 삭제 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
                    Database.setUserBookingData(childPathAry, memberObj, true);

                    // Todo 3. NotificationGroup 삭제 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
                    Database.setNotificationGroup(childPathAry, memberObj, true);

                    // Todo 4. 유저별 예약현황, 노티피케이션 그룹 재생성
                    // 2. 유저별로 예약 생성하기 (백그라운드 작업) - setUserBookingData(chidPath, memberAry, isRemove)
                    Database.setUserBookingData(childPathAry, memberObj, false);

                    // Todo 3. NotificationGroup 생성하기 (백그라운드 작업) - setNotificationGroup(bookingPath, memberAry, isRemove)
                    Database.setNotificationGroup(childPathAry, memberObj, false);

                })
            }

            callback(true);

        } catch (error) {
            console.log('listenWriteBook error: ' + error.toString())

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
                });

                bookLists = books;
            });

            callback(bookLists);
        });
    }

    static searchGroupId(groupID, callback) {
        try {

            console.log("searchGroupId groupID: " + groupID)

            let groupDataPath = `${rootGroupData}${groupID}`;

            firebase.database().ref().child(groupDataPath).once('value', function(snapshot) {

                console.log("searchGroupId snapshot: " + Object.values(snapshot));

                var groupLists = {};

                if(snapshot === null) {
                    console.log("searchGroupId call snapshot undefined");
                    callback(groupLists);
                    return;
                }

                snapshot.ref.child("selectedDates").once('value', function(dates) {
                    console.log("call snapshot.ref.selectedDates dates: " + dates);

                    var dateLists = [];

                    dates.forEach((child) => {
                        console.log("searchGroupId /selectedDates child: " + Object.values(child));

                        var selectedDates = dateLists.slice()
                        selectedDates.push({selectDate: child.val()});

                        dateLists = selectedDates;
                    });

                    groupLists.dateLists = dateLists;
                });

                snapshot.ref.child("selectedUsers").once('value', function(users) {
                    console.log("call snapshot.ref.selectedUsers users: " + users);

                    var userLists = [];

                    users.ref.child("owner").once('value', function(owner) {
                        userLists.push({selectUser: owner.val()});
                    });

                    users.ref.child("members").once('value', function(member) {
                        member.forEach((child) => {
                            console.log("searchGroupId /userIDs child: " + Object.values(child));

                            var selectedUsers = userLists.slice()
                            selectedUsers.push({selectUser: child.val()});

                            userLists = selectedUsers;
                        });

                        groupLists.userLists = userLists;
                    });
                });

                snapshot.ref.child("selectedTimes").once('value', function(times) {
                    console.log("call snapshot.ref.selectedTimes times: " + times);

                    var timeLists = [];

                    times.forEach((child) => {
                        console.log("searchGroupId /selectedTimes child: " + Object.values(child));

                        var selectedTimes = timeLists.slice()
                        selectedTimes.push({selectedTime: child.val()});

                        timeLists = selectedTimes;
                    });

                    groupLists.timeLists = timeLists;
                    // groupLists.push(timeLists);
                });


                console.log("searchGroupId groupLists: " + Object.values(groupLists));
                callback(groupLists);

            });
            // let groupDataPath = `${rootGroupData}${groupID}/selectedDates`;
            // firebase.database().ref().child(groupDataPath).once('value', function(snapshot) {
            //
            //     console.log("searchGroupId snapshot: " + Object.values(snapshot));
            //
            //     var groupLists = [];
            //
            //     if(snapshot === null) {
            //         console.log("searchGroupId call snapshot undefined");
            //         callback(groupLists);
            //         return;
            //     }
            //
            //     snapshot.forEach((child) => {
            //         console.log("searchGroupId child: " + Object.values(child));
            //
            //         var selectedDates = groupLists.slice()
            //         selectedDates.push({selectedDate: child.val()});
            //
            //         groupLists = selectedDates;
            //     });
            //
            //     console.log("searchGroupId groupLists: " + Object.values(groupLists));
            //     callback(groupLists);
            //
            // });
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
            memberAry = memberObj.members.slice();
            memberAry.push(memberObj.owner);

            // 유저별로 회의정보 추가하기(userID/yymmdd/floor/roomID/beginTime 형태)
            memberAry.map( (uid)=> {
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

    // 오늘 날짜 이후 기준으로 내 예약 현황 가져오기
    static getMyBooking(callback) {
        try {
            console.log("call getMyBooking");

            let myUid = Database.getAuthUid();
            let today = CommonUtil.getTodayYYMMDD();

            let userDataPath = `${rootUserInfo}${myUid}`;
            console.log("getMyBooking userDataPath: " + userDataPath);

            var userDataRef = firebase.database().ref(userDataPath);

            // userDataRef.on("value", function(snapshot) {
            //     console.log("getMyBooking snapshot: " + Object.values(snapshot))
            //     console.log("getMyBooking snapshot.key: " + snapshot.key)
            // });


            // Firebase .on으로 대기 child가 추가,삭제 이벤트 수신 대기 (child_added, child_removed)
            // 오늘 날짜 이상의 데이터만 key 기준으로 정렬해서 데이터 가져옴
            userDataRef.orderByKey().startAt(today).on("child_added", function(snapshot) {
                console.log("getMyBooking orderByKey snapshot: " + Object.values(snapshot))
                console.log("getMyBooking orderByKey snapshot.key: " + snapshot.key)
            });

            userDataRef.orderByKey().startAt(today).on("child_removed", function(snapshot) {
                console.log("getMyBooking orderByKey snapshot: " + Object.values(snapshot))
                console.log("getMyBooking orderByKey snapshot.key: " + snapshot.key)
            });

        } catch (error) {
            console.log('getMyBooking error: ' + error.toString())
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
