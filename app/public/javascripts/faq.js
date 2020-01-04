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
    })
    // element is hidden: change minus-icon to plus-icon & font-weight to regular
    .on('hide.bs.collapse', function(){
      $(this).prev(".card-header").find(".fa").removeClass("fa-minus").addClass("fa-plus");
      $(this).prev(".card-header").find(".faq-link").removeClass("font-weight-bold");
    });
}
