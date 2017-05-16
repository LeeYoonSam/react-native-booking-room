import SecretText from "../consts/SecretText";

const API_URL = "https://fcm.googleapis.com/fcm/send";

class FirebaseClient {

    constructor() {
        this.sendData = this.sendData.bind(this);
    }

    sendData(tokens, pushTitle, pushContent) {
        console.log("call sendData");
        if(tokens.length === 0) {
            return;
        }

        var sendTokenPromise = new Promise(
            // resolver(결정자) 함수는 프로미스 (이행을) 결정 또는 거부하는
            // 능력과 함께 호출됩니다
            function(resolve, reject) {
                resolve(tokens);
            }
        );

        sendTokenPromise.then( function(userTokens) {
            var sequence = Promise.resolve();

            // forEach 문 안에서 Promise 진행
            userTokens.forEach(function(userToken){
                sequence = sequence.then(function(){
                    return userToken;
                })
                .then(
                    // 이행값 기록
                    function(userToken) {
                        let body = {
                            to: userToken,
                            notification:{
                                title: pushTitle,
                                body: pushContent,
                                sound: "default",
                                click_action: SecretText.PUSH_ACTION
                            },
                            data:{
                                title: pushTitle,
                                body: pushContent,
                                click_action: SecretText.PUSH_ACTION,
                                remote: true
                            },
                            priority: "normal"
                        }

                        var jsonBody = JSON.stringify(body);
                        // console.log("promise test body: " + jsonBody);

                        // 푸시 내용 세팅 후 새로운 프로미스를 생성해서 딜레이를 걸고 넘겨준다.
                        // return new Promise(resolve => setTimeout( () => {
                        //     resolve(jsonBody)
                        // }, 2000));
                        // resolve(jsonBody);

                        // 딜레이를 안줘도 될것 같아서 바로 리턴(클라이언트에서 푸시를 발송하는거라 앱을 종료해버리면 푸시가 전송되지 않으므로 최대한 빨리 보낼수 있게 딜레이 제거)
                        return jsonBody;
                    })
                .then( async function(jsonBody) {

                    // 전달받은 푸시메시지를 post api를 통해서 푸시전송 - async await로 비동기 처리
                    let headers = new Headers({
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        "Authorization": "key=" + SecretText.SERVER_KEY
                    });

                    await fetch(API_URL, {
                        method: "POST",
                        headers,
                        body: jsonBody
                    })
                    .then(response => console.log("success response: " + JSON.stringify(response)))
                    .catch(error => console.log("Error sending " + error));
                })
                }).catch(function(err){
                    console.log(err + ' failed to load!')
                })
        })
        .catch(
            // 거부 이유 기록
            function(reason) {
                console.log('Handle rejected promise ('+reason+') here.');
            }
        );
    }
}

let firebaseClient = new FirebaseClient();
export default firebaseClient;
