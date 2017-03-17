import * as firebase from "firebase";

let rootMeetingRoom = "MeetingRoom/";
let rootBookData = "BookData/";

class Database {

    static getAuthUid() {
        return firebase.auth().currentUser.uid;
    }

    static getAuthEmail() {
        return firebase.auth().currentUser.email;
    }

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
                    roomTitle: child.val()
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

    // 해당 예약이 요청한 유저와 일치하는지 확인 후 삭제 처리
    static checkAndDeleteMatchUser(yymmdd, floor, roomID, beginTime, callback) {

        /*
        ex) BookData/20170308/12/A/9/userID =>
        */
        let bookListBasePath = `${rootBookData}${yymmdd}/${floor}/${roomID}/${beginTime}`;
        let bookListCheckPath = `${bookListBasePath}/userID`;
        console.log("checkMatchUser bookListBasePath: " + bookListBasePath);

        firebase.database().ref().child(bookListCheckPath).once("value", (snapshot) => {
            var userID = snapshot.val();
            if (userID === firebase.auth().currentUser.uid) {
                // 삭제 처리
                firebase.database().ref().child(bookListBasePath).remove();

                callback(true);
            } else {
                // 삭제 불가
                callback(false);
            }
        });
    }

    // 회의실 예약 및 수정 하기
    static listenWriteBook(yymmdd, floor, roomID, beginTime, endTime, bookType, bookMemo, callback) {

        try {
            console.log('listenWriteBook yymmdd: ' + yymmdd + ' floor: ' + floor + ' roomID: ' + roomID + ' beginTime: ' + beginTime + ' endTime: ' + endTime + ' bookType: ' + bookType + ' bookMemo: ' + bookMemo);

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
            console.log("listenWriteBook bookWritePath: " + bookWritePath);


            console.log("FB auth() userID: " + firebase.auth().currentUser.uid + " userName: " + firebase.auth().currentUser.email);

            // firebase.database().ref(bookWritePath).push({
            firebase.database().ref(bookWritePath).set({
                userID:firebase.auth().currentUser.uid,
                userEmail:firebase.auth().currentUser.email,
                endTime: endTime,
                modifyDate: new Date(),
                bookMemo: bookMemo,
                bookType: bookType
            });

            callback(true);
        } catch (error) {
            let err = error.toString();
            Alert.alert(err);

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
                    beginTime: child.key,
                    endTime: child.val().endTime,
                    modifyDate: child.val().modifyDate,
                    bookMemo: child.val().bookMemo,
                    bookType: child.val().bookType
                });

                bookLists = books;
            });

            callback(bookLists);
        });
    }
}

module.exports = Database;
