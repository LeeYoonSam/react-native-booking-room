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
};
