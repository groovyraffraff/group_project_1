////////////////////////////////// Fade in effect//////////////////////////////
$(document).ready(function($) {
    window.setTimeout(function() {
        $("#cardbox").fadeIn(2000);
    }, 300); // 3 seconds
});
////////////////////////////////// end of Fade in effect///////////////////////////


// scroll btn ///

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {
    scrollFunction()
};

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("topBtn").style.display = "block";
    } else {
        document.getElementById("topBtn").style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}
//end of scroll btn//