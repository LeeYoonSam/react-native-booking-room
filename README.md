# react-native-booking-room

This app is my personal project.

## Using ReactNative + Firebase(Auth, Realtime DB) booking Project

## how to run
1. clone this project
2. npm install
3. insert your firebase key in (src/firebase/Firebase.js)

```
import * as firebase from "firebase";

class Firebase {

    // Initialises Firebase
    
    static initialise() {

        // Initialize default app
        // Retrieve your own options values by adding a web app on
        // https://console.firebase.google.com
        firebase.initializeApp({
          apiKey: "AIza....",                             // Auth / General Use
          authDomain: "YOUR_APP.firebaseapp.com",         // Auth with popup/redirect
          databaseURL: "https://YOUR_APP.firebaseio.com", // Realtime Database
          storageBucket: "YOUR_APP.appspot.com",          // Storage
          messagingSenderId: "123456789"                  // Cloud Messaging
        });
    }
}

module.exports = Firebase;
```

### this project is not yet complete.
