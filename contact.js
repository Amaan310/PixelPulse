document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form');
    const submitButton = contactForm.querySelector('.submit-button');

    emailjs.init('Kustmyg_Zd3RPfL4P'); 

    contactForm.addEventListener('submit', function(event) {
        event.preventDefault(); 

        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        const serviceID = 'service_dee1ab1';    
        const templateID = 'template_2qi60c1';  

        emailjs.sendForm(serviceID, templateID, this)
            .then(() => {
                // Success
                submitButton.textContent = 'Message Sent! ✨';
                contactForm.reset();
                setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }, 4000);
            }, (err) => {
                // Error
                alert('Failed to send message: ' + JSON.stringify(err));
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            });
    });
});