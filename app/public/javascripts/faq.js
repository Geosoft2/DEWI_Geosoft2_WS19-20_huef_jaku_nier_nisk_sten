// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";

/**
* @desc changes the icons and the font-weight regarding the visibility of the collapse elements
*/
function changeIconCollapse(){
  // https://getbootstrap.com/docs/4.0/components/collapse/
  $(".collapse")
    // element is shown: change plus-icon to minus-icon & font-weight to bold
    .on('show.bs.collapse', function(){
      $(this).prev(".card-header").find(".fa").removeClass("fa-plus").addClass("fa-minus");
      $(this).prev(".card-header").find(".faq-link").addClass("font-weight-bold");
      // window.location.hash = $(this).prev(".card-header").attr('id');
    })
    // element is hidden: change minus-icon to plus-icon & font-weight to regular
    .on('hide.bs.collapse', function(){
      $(this).prev(".card-header").find(".fa").removeClass("fa-minus").addClass("fa-plus");
      $(this).prev(".card-header").find(".faq-link").removeClass("font-weight-bold");
    });
}


/**
* @desc checks whether a hash is present in the URL. If yes, the function 'collapseHash' is executed.
*/
function isHashInUrl(){
  if(window.location.hash) {
    collapseHash();
  }
}


/**
* @desc shows the collapsed-element corresponding to the hash.
*/
function collapseHash(){
  // puts hash in variable, and removes the # character
  var hash = window.location.hash.substring(1);
  $('#collapse'+hash).collapse('show');
}

/**
* @desc adds to every host-element the host of currently used page
*/
function host() {
  var host = location.host;
  $('host').text(host);
  $('a.host').each(function(i, obj){
    var href = $(obj).attr('href');
    console.log(href.split('//')[0]);
    console.log(href.split('//')[1]);
    $(obj).attr('href', href.split('//')[0]+'//'+host+href.split('//')[1]);
  });
}
