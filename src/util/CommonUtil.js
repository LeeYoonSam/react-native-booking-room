'use strict';

module.exports = {

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

    getDayOfWeek(date) {
        var week = new Array('일', '월', '화', '수', '목', '금', '토');
        return week[date.getDay()];
    },

};
