document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form');
    const submitButton = contactForm.querySelector('.submit-button');

    contactForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Stop the form from redirecting to Formspree

        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        const formData = new FormData(contactForm);
        
        fetch(contactForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                // Success!
                submitButton.textContent = 'Message Sent! ✨';
                contactForm.reset(); // Clear the form fields
                setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }, 4000); // Reset button after 4 seconds
            } else {
                // Error
                response.json().then(data => {
                    if (Object.hasOwn(data, 'errors')) {
                        alert(data["errors"].map(error => error["message"]).join(", "));
                    } else {
                        alert('Oops! There was a problem submitting your form.');
                    }
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                });
            }
        }).catch(error => {
            // Network error
            alert('Oops! There was a network error.');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        });
    });
});