"use strict";

var MyBookingModel = {
    yymmdd: "",
    booking: {},

    setYYMMDD: function(yymmdd) {
        this.yymmdd = yymmdd;
        return this;
    },

    setSubObject: function(subObject) {
        // JSON.stringify => javascript value를 JsonString 값으로 변환 - 파이어베이스 디비가 json 형태이므로 그대로 담을수 있다.
        var jsonString = JSON.stringify(subObject);

        // JSON.parse => JsonString 형태의 값을 JsonObject 값으로 변환 - JsonString 상태로 저장하면 한줄 string 처럼 나와서 다시 JsonObject로 컨버팅
        this.booking = JSON.parse(jsonString);

        return this;
    },
}

module.exports = MyBookingModel;
