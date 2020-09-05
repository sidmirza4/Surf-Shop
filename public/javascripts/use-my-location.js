// We can't submit a form by clicking on a link, but we are still using preventDefault() ...
// .. in order to make sure, that if in future, we change the link to a button, or an input, with ..
// .. type as submit, we don't submit the form, by clicking that.

function geoFindMe(e) {

    e.preventDefault();

    const status = document.querySelector('#status');
    const locationInput = document.querySelector('#location');

    function success(position) {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;

        status.textContent = '';
        locationInput.value = `[${longitude}, ${latitude}]`;
    }

    function error() {
        status.textContent = 'Unable to retrieve your location!';
    }

    // navigator is a variable that is already available to us. It's on the window object.
    if (!navigator.geolocation) {
        status.textContent = 'Geolocation is not supported in your browser!';
    } else {
        status.textContent = 'Locating...'
        navigator.geolocation.getCurrentPosition(success, error);
    }
}

// Now we are not invoking the function. We are gonna let JS invoke it, whenever the ..
// .. user clicks on the link.
document.querySelector('#find-me').addEventListener('click', geoFindMe);

document.querySelector('.filter__div--reset-link').addEventListener('click', e => {
    e.reload();
});