(function () {
    'use strict';

    /* Pre-fills the shared #enquire form's "Product of Interest" field
       when a visitor clicks "Enquire Now" on a specific product card.
       Used on organics.html and plant-nutrients-fertilizers.html, where
       all product cards funnel into one shared enquiry form at the
       bottom of the page (#enquire / .enquire-form-box).

       This is a separate, additive listener — it does not replace or
       modify the smooth-scroll click handler already bound by main.js
       to the same links; both simply run on the same click. */

    function getProductName(link) {
        var card = link.closest('.product-data');
        if (!card) return '';
        var heading = card.querySelector('h3');
        return heading ? heading.textContent.trim() : '';
    }

    function fillProductField(name) {
        if (!name) return;
        var field = document.querySelector('#enquire input[name="product"]');
        if (!field) return;
        field.value = name;
        // Let anything listening for changes (validation, etc.) know the
        // value changed programmatically.
        field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function init() {
        var enquireLinks = document.querySelectorAll('a[href="#enquire"]');
        enquireLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                var productName = getProductName(link);
                fillProductField(productName);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
