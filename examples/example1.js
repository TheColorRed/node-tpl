var tpl = require("../tpl2.js");

tpl.setcwd(__dirname);

//tpl.assign("musketeers", {
//    "Athos": {color: "red", age: "20"},
//    "Aramis": {color: "green", age: "30"},
//    "Porthos": {color: "blue", age: "12"},
//    "D'Artagnan": {color: "black", age: "25"}
//});

tpl.assign("musketeers", [
    {
        name: "Athos",
        color: "red",
        age: "20",
        animals: [
            {type: "dog", name: "Ralph"},
            {type: "cat", name: "Sally"}
        ]
    }, {
        name: "Aramis",
        color: "green",
        age: "30",
        animals: [{type: "cat", name: "Milly"}]
    }, {
        name: "Porthos",
        color: "blue",
        age: "12",
        animals: [{type: "bird", name: "Ted"}]
    }, {
        name: "D'Artagnan",
        color: "black",
        age: "25",
        animals: [{type: "fish", name: "Yum"}]
    }
]);

//tpl.assign("time", new Date().getHours());
//tpl.assign("filename", "nav.tpl");

tpl.display("templates/mypage.tpl");