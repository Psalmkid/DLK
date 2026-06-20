(function () {
    'use strict';

    /* Backend: Web3Forms (https://web3forms.com).
       Replaces the earlier PHPMailer/SMTP/send-quote.php setup entirely —
       no PHP, no SMTP credentials, no vendor/ folder needed. Web3Forms
       handles delivery; we just POST FormData to their endpoint. */
    var ENDPOINT   = 'https://api.web3forms.com/submit';
    var ACCESS_KEY = '67d55466-4039-4683-88fc-74128f9e8b98';

    /* Forms this handler binds to. Discovered from the live site's markup:
       - form.in-touch-form  (most pages: quote/enquiry forms, several field shapes)
       - form.contact-form   (contact.html: name/phone/email/subject/message)
       Field sets vary by page (some have name/message/product, some don't),
       and submit-button labels vary too ("Request A Quote", "Submit",
       "Send Enquiry", "Find a Retailer"). So instead of matching specific
       field names or button text, this binds on form CLASS and submits
       whatever fields actually exist via FormData — works regardless of
       which fields a given page's form happens to have. */
    var FORM_SELECTOR = 'form.in-touch-form, form.contact-form';

    function parseJson(text) {
        try {
            return JSON.parse(text);
        } catch (e) {
            return null;
        }
    }

    function ensureFeedbackBox(form) {
        var wrap = form.closest('.form-field') || form.parentElement || form;
        var box = wrap.querySelector('.quote-form-feedback');
        if (!box) {
            box = document.createElement('p');
            box.className = 'quote-form-feedback';
            box.setAttribute('role', 'status');
            form.insertAdjacentElement('afterend', box);
        }
        return box;
    }

    function showFeedback(form, message, isError) {
        var box = ensureFeedbackBox(form);
        box.textContent = message;
        box.classList.toggle('quote-form-feedback--error', !!isError);
    }

    function ensureSpinner(submitBtn) {
        var parent = submitBtn.parentNode;
        if (!parent) {
            return null;
        }
        var sp = parent.querySelector('.quote-inline-spinner');
        if (!sp) {
            sp = document.createElement('span');
            sp.className = 'quote-inline-spinner';
            sp.setAttribute('aria-hidden', 'true');
            parent.insertBefore(sp, submitBtn);
        }
        return sp;
    }

    function setLoading(form, submitBtn, on) {
        if (!submitBtn) {
            return;
        }
        ensureSpinner(submitBtn);
        form.classList.toggle('quote-form-is-loading', !!on);
        submitBtn.disabled = !!on;
        submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
        // Swap the button's own label while sending, same idea as the
        // reference snippet, but without clobbering disabled state timing.
        if (submitBtn.tagName === 'BUTTON') {
            if (on) {
                submitBtn.dataset.origLabel = submitBtn.textContent;
                submitBtn.textContent = 'Sending…';
            } else if (submitBtn.dataset.origLabel) {
                submitBtn.textContent = submitBtn.dataset.origLabel;
            }
        }
    }

    function getSubmitButton(form) {
        return form.querySelector('input[type="submit"], button[type="submit"]');
    }

    /* Basic client-side check: every form here has at least an email field.
       If it's empty, don't bother hitting the network. */
    function hasMinimumFields(form) {
        var emailField = form.querySelector('input[name="email"]');
        return !!(emailField && emailField.value.trim() !== '');
    }

    function bindForms() {
        document.querySelectorAll(FORM_SELECTOR).forEach(function (form) {
            var submitBtn = getSubmitButton(form);
            if (!submitBtn) {
                return;
            }

            form.addEventListener('submit', function (e) { console.log('HANDLER FIRED for', form.className);
                e.preventDefault();

                if (form.dataset.quoteSending === '1') {
                    return;
                }

                if (!hasMinimumFields(form)) {
                    showFeedback(form, 'Please enter your email address.', true);
                    return;
                }

                var fd = new FormData(form);
                fd.append('access_key', ACCESS_KEY);

                // IMPORTANT: from_name must reflect the actual submitter,
                // not a fixed string. A literal constant sent identically
                // on every submission is exactly the kind of repeated,
                // non-varying payload spam filters key on — this was
                // previously hardcoded to "DLK Fertilizer Website" on
                // every single request, which is the most likely reason
                // every submission was being flagged as spam.
                var nameField = form.querySelector('input[name="name"]');
                var emailField = form.querySelector('input[name="email"]');
                var submitterName = (nameField && nameField.value.trim())
                    || (emailField && emailField.value.trim())
                    || 'Website Visitor';
                fd.set('from_name', submitterName);

                // Helpful context fields Web3Forms will include in the
                // notification email — which page/button this came from,
                // since several pages share similar form shapes.
                // IMPORTANT: use set(), not append() — contact.html has
                // its own real "subject" input field, so FormData(form)
                // already captured the visitor's typed subject. Using
                // append() here was creating a SECOND, conflicting
                // "subject" entry in the same payload on every contact.html
                // submission, which is exactly the kind of malformed/
                // duplicate field a spam filter flags.
                var btnLabel = submitBtn.value || submitBtn.textContent || '';
                var existingSubject = (form.querySelector('input[name="subject"], textarea[name="subject"]') || {}).value;
                fd.set('subject', (existingSubject && existingSubject.trim()) || (btnLabel.trim() || 'Website Enquiry') + ' — ' + document.title);
                fd.append('page_url', window.location.href);

                form.dataset.quoteSending = '1';
                setLoading(form, submitBtn, true);
                showFeedback(form, 'Sending…', false);

                fetch(ENDPOINT, {
                    method: 'POST',
                    body: fd,
                    headers: { Accept: 'application/json' },
                })
                    .then(function (r) {
                        return r.text().then(function (t) {
                            return { ok: r.ok, json: parseJson(t) };
                        });
                    })
                    .then(function (res) {
                        if (!res.json) {
                            showFeedback(form, 'Unexpected server response.', true);
                            return;
                        }
                        // Web3Forms responses are nested: on success,
                        // { success: true, message: "..." } at top level
                        // (recent API) — but some integrations document a
                        // nested body.message shape too, so check both.
                        var message = res.json.message
                            || (res.json.body && res.json.body.message)
                            || '';
                        if (res.ok && res.json.success) {
                            showFeedback(form, message || 'Thank you! We will be in touch.', false);
                            form.reset();
                        } else {
                            showFeedback(form, message || 'Something went wrong.', true);
                        }
                    })
                    .catch(function () {
                        showFeedback(form, 'Network error. Please try again.', true);
                    })
                    .finally(function () {
                        form.dataset.quoteSending = '0';
                        setLoading(form, submitBtn, false);
                    });
            });
        });
    }

    function init() {
        bindForms();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();