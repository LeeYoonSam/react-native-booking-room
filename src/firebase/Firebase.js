import * as firebase from "firebase";

class Firebase {
    /**
    * Initialises Firebase
    */
    static initialise() {

        firebase.initializeApp({
            apiKey: "AIza....",                             // Auth / General Use
            authDomain: "YOUR_APP.firebaseapp.com",         // Auth with popup/redirect
            databaseURL: "https://YOUR_APP.firebaseio.com", // Realtime Database
            storageBucket: "YOUR_APP.appspot.com",          // Storage
            messagingSenderId: "123456789"                  // Cloud Messaging
        });
        


        // firebase.database.enableLogging((message)=> {
        //     console.log("[FIREBASE]", message);
        // });
    }
}

module.exports = Firebase;
