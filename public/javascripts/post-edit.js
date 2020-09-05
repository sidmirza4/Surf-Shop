// Find Post Edit Form
let postEditForm = document.getElementById('postEditForm');

// Add submit listener to Post Edit Form
postEditForm.addEventListener('submit', function(event) {
    
    // Find length of Uploaded Images
    let imageUploads = document.getElementById('imageUpload').files.length;

    // Find Total number of Existing Images
    let existingImgs = document.querySelectorAll('.imageDeleteCheckbox').length;

    // Find total number of Potential Deletions
    let imgDeletions = document.querySelectorAll('.imageDeleteCheckbox:checked').length;

    // Figure out if the form can be submitted or not
    let newTotal = existingImgs - imgDeletions + imageUploads;
    
    if (newTotal > 4) {
        event.preventDefault();
        let removalAmt = newTotal - 4;
        alert(`You need to remove at least ${removalAmt} (more) image${removalAmt ===1 ? '':'s'}!`);
    }
    
    if (newTotal <= 0) {
        event.preventDefault();
        alert(`You need to upload at least 1 Image`);
    }
});

// Add Event Listened to Labels of Images
var checks = Array.from(document.querySelectorAll('.editPost__form-checkLabel'));
checks.forEach(el => {
    el.addEventListener('click', () => {
        el.nextElementSibling.classList.toggle('editPost__fadein');
        el.nextElementSibling.classList.toggle('editPost__fadeout');
    });
});