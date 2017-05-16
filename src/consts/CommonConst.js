'use strict';

module.exports = {

  TIME_JSON: [
      {"hour":9, "type":"am"},
      {"hour":10, "type":"am"},
      {"hour":11, "type":"am"},
      {"hour":12, "type":"pm"},
      {"hour":13, "type":"pm"},
      {"hour":14, "type":"pm"},
      {"hour":15, "type":"pm"},
      {"hour":16, "type":"pm"},
      {"hour":17, "type":"pm"},
      {"hour":18, "type":"pm"},
      {"hour":19, "type":"pm"},
      {"hour":20, "type":"pm"},
      {"hour":21, "type":"pm"},
      {"hour":22, "type":"pm"}
  ],

  BOOK_TYPE: [
      {id: "m", name: "회의", color: "red"},
      {id: "i", name: "면접", color: "green"},
      {id: "s", name: "스터디", color: "blue"},
      {id: "e", name: "기타", color: "goldenrod"}
  ],

  REPEAT_TYPE: [
      {id:"one", name:"한번", workday:1, repeat: false},
      {id:"day", name:"매일", workday:5, repeat: true},
      {id:"week", name:"매주", workday:1, repeat: true}
  ],

  BOOKING_TYPE: {
      type_write: 0,
      type_update_all: 1,
      type_update_one: 2,
  }
};
