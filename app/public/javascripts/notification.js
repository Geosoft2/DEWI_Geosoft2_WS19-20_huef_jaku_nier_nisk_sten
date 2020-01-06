// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";

function browserNotification(content){
  Push.create("DEWI", {
    body: content,
    icon: '/images/DEWI_Logo.svg',
    timeout: 8000,
    onClick: function () {
        window.focus();
        this.close();
    }
  });
}
