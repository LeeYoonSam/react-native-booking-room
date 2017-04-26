'use strict';

import React, { Component } from 'react';
import {
    View,
} from 'react-native';

Array.prototype._userSearch = function(keyword) {

    var clone =  this.slice();
    var searchResult = [];

    for(var i = 0; i < clone.length; i ++) {
        // 비교문자, 키워드 전부 소문자로 대치해서 비교
        if(clone[i].userName.toLowerCase().search(keyword.toLowerCase()) !== -1) {
            searchResult.push(clone[i]);
        }
    }

    return searchResult;
}

Array.prototype._removeMyUid = function(userID) {

    var clone =  this.slice();

    for(var k = 0; k < clone.length; k ++) {
        // userID가 일치하는 유저 추가
        if(clone[k].userID === userID) {
            this.splice(k, 1);
        }
    }

    return this;
}

module.exports = {

    cloneObject(obj) {
        if (obj === null || typeof(obj) !== 'object')
        return obj;

        var copy = obj.constructor();

        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = this.cloneObject(obj[attr]);
            }
        }
        return copy;
    },

    removeDuplicateAry(arr) {
        let hashTable = {};
        return arr.filter((el) => {
            let key = JSON.stringify(el);
            let alreadyExist = !!hashTable[key];
            return (alreadyExist ? false : hashTable[key] = true);
        });
    },

    // 1자리 숫자일때 01, 001 이런 형태로 만들어주는 함수 'width:자리수를 의미' - ex) pad(1, 2) => 01 , pad(1, 3) => 001
    pad(n, width) {
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
    },

    // Date를 yyyymmdd 형태로 만들어주는 함수
    dateToYYMMDD(originDate) {
        return originDate.getFullYear() + "" + this.pad((originDate.getMonth()+1), 2) + "" + this.pad((originDate.getDate()), 2);
    },

    checkLength(param) {
        return param.toString().length;
    },

    checkValidEmpty(param) {
        return parseInt(this.checkLength(param)) > 0 ? false : true;
    },

    // 몇일 후인지 체크
    calcDiffDays(startDate, endDate) {

        // console.log('startDate: ' + startDate + ' endDate: ' + endDate);

        var sYear = startDate.substring(0,4);
        var sMonth = startDate.substring(4,6);
        var sDay = startDate.substring(6,8);
        // console.log('sYear: ' + sYear + 'sMonth: ' + sMonth + 'sDay: ' + sDay );

        var eYear = endDate.substring(0,4);
        var eMonth = endDate.substring(4,6);
        var eDay = endDate.substring(6,8);
        // console.log('eYear: ' + eYear + 'eMonth: ' + eMonth + 'eDay: ' + eDay );

        var start = new Date(`${sMonth}/${sDay}/${sYear}`);
        var end = new Date(`${eMonth}/${eDay}/${eYear}`);
        // console.log('start: ' + start + ' end: ' + end);

        var timeDiff = Math.abs(end.getTime() - start.getTime());
        // console.log('timeDiff: ' + timeDiff);

        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    },

    getTodayYYMMDD() {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd < 10) {
            dd = '0' + dd
        }

        if(mm<10) {
            mm = '0' + mm
        }

        return `${yyyy}${mm}${dd}`;
    },

    getDayOfWeek(date) {
        var week = new Array('일', '월', '화', '수', '목', '금', '토');
        return week[date.getDay()];
    },

    renderSeparator(sectionID, rowID, adjacentRowHighlighted) {
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
};
