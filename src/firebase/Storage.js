import * as firebase from "firebase";
import CommonConst from "../consts/CommonConst";

var rootMeetingRoom = "MeetingRoom/";

class Storage {

    getImage(imageName) {
        console.log("Storage imageName: " + imageName);

        firebase.storage().ref().child(`${rootMeetingRoom}${imageName}`).getDownloadURL().then( function(url) {
            console.log("Storage image url: " + url);
            return url;
            // return new Promise(resolve => {
            //   setTimeout(() => {
            //     resolve(url);
            //   }, 2000);
            // });

            // return url;
        }).catch(function(error) {
            console.log("이미지 로드 오류: " + error);
        });
    }
}

let firebaseStorage = new Storage();
export default firebaseStorage;
