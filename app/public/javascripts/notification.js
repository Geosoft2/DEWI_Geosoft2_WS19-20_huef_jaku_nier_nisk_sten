// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";

function browserNotification(title, content){
  Push.create(title, {
    body: content,
    icon: '/images/DEWI_Logo.svg',
    timeout: 8000,
    onClick: function () {
        window.focus();
        this.close();
    }
  });
}
