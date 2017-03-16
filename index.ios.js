import React, { Component } from 'react';
import {
  AppRegistry,
} from 'react-native';

var Main = require('./src/main')

// /src/main.js를 registry
AppRegistry.registerComponent('BookMeetingRoom', () => Main);
