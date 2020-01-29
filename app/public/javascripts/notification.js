// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";

/**
 * Shows a browser notification on the bottom right
 * @param {string} title title of notifiaction
 * @param {string} content content of notifiaction
 */
function browserNotification(title, content){
  Push.create(title, {
    body: content,
    icon: '/media/images/DEWI_Logo.svg',
    timeout: 8000,
    onClick: function () {
        window.focus();
        this.close();
    }
  });
}
