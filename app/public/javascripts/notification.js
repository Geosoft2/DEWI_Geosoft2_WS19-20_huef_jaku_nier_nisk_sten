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

/**
 * Shows a snackbar on the Top Right
 * @param {String} text to show in the snackbar
 */
function snackbarWithText(text) {
  const date = Date.now()
  $('.snackbar').prepend(
      '<div class="toast '+date+' rounded-0" style="border: 1px solid blue; background-color: lightblue" ' +
      'role="alert" aria-live="assertive" aria-atomic="true" data-autohide="true" data-delay="3000">'+
      '<div class="toast-header">'+
      '<strong class="mr-auto" background-color: lightblue>'+text +'</strong>'+
      '<button type="button" class="btn2" background-color: lightblue onclick="showStatus()" aria-label="Info">'+
      '<span aria-hidden="true">More Info</span>'+
      '</button>'+
      '<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">'+
      '<span aria-hidden="true">×</span>'+
      '</button>'+
      '</div>'+
      '</div>');
  $('.toast.'+date).toast('show');

}
