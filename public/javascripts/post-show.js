/* global $ */

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: post.geometry.coordinates,
    zoom: 7
});

// Create a HTML element for our post Location / Marker
var el = document.createElement('div');
el.className = 'marker';

// Make a marker for our location and add to the Map
new mapboxgl.Marker(el)
    .setLngLat(post.geometry.coordinates)
    .setPopup(new mapboxgl.Popup({
            offset: 25
        }) // add popups
        .setHTML('<h3>' + post.title + '</h3><p>' + post.location + '</p>')
    )
    .addTo(map);

// Toggle Edit Review Form
$('.postShow__review-editBtn').on('click', function() {
    // Toggle the Edit Button Text on Click
    $(this).text() === 'Edit' ? $(this).text('Cancel') : $(this).text('Edit');
    // Toggle Visibility of the edit review form
    $(this).siblings('.postShow__review-editForm').toggleClass('postShow__review-undisplayed, postShow__review-displayed');

});

// Add Click Listener for clearing of rating from Edit / New form
$('.clear-rating').click(function() {
    // console.log($(this).parent().children('fieldset').children('input.input-no-rate'));
    $(this).parent().children('fieldset').children('input.input-no-rate').click();
});




