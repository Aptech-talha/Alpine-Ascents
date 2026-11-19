/* ============================================================
   Contact Form Module – Alpine Ascents
   Client-side validation with real-time feedback and a SIMULATED
   submission.

   There is no backend: nothing is emailed, queued or delivered, and the
   entered values are never written to localStorage, sessionStorage,
   cookies or IndexedDB. The success panel only confirms that the form
   passed validation.
   ============================================================ */

const ContactForm = {
    form: null,
    isSubmitting: false,

    /* --------------------------------------------------------
       init()
       -------------------------------------------------------- */
    init() {
        this.form = document.getElementById('contact-form');
        if (!this.form) return;

        // One-off privacy cleanup: an early prototype wrote submissions to this
        // key. Current code never writes it; removing it clears any leftover
        // data from a previous visit. Failure (storage blocked) is harmless.
        try {
            localStorage.removeItem('alpineAscents_contactSubmissions');
        } catch (e) {
            // Ignore storage access errors — the form works without storage
        }

        // Submit handler
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation on blur and input
        const fields = [
            { id: 'contact-name',    validator: () => this.validateName() },
            { id: 'contact-email',   validator: () => this.validateEmail() },
            { id: 'contact-subject', validator: () => this.validateSubject() },
            { id: 'contact-message', validator: () => this.validateMessage() }
        ];

        fields.forEach(({ id, validator }) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('blur', validator);
            el.addEventListener('input', validator);
        });

        // Character counter for message
        const msgEl = document.getElementById('contact-message');
        if (msgEl) {
            let counter = document.getElementById('message-char-counter');
            if (!counter) {
                counter = document.createElement('small');
                counter.id = 'message-char-counter';
                counter.className = 'text-muted d-block mt-1';
                msgEl.parentNode.appendChild(counter);
            }
            this.updateCharCounter();
            msgEl.addEventListener('input', () => this.updateCharCounter());
        }
    },

    /* --------------------------------------------------------
       handleSubmit(e)
       -------------------------------------------------------- */
    handleSubmit(e) {
        e.preventDefault();

        // Prevent duplicate submissions while processing
        if (this.isSubmitting) return;

        if (!this.validateAll()) return;

        this.isSubmitting = true;
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing Demo...';
        }

        // Simulate client-side processing without storing personal data
        setTimeout(() => {
            this.showSuccess();
            this.resetForm();

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
            this.isSubmitting = false;
        }, 600);
    },

    /* --------------------------------------------------------
       validateAll()  – returns true only when every field passes
       -------------------------------------------------------- */
    validateAll() {
        // Evaluate all – don't short-circuit so every field
        // shows its feedback simultaneously.
        let isValid = true;
        isValid = this.validateName() && isValid;
        isValid = this.validateEmail() && isValid;
        isValid = this.validateSubject() && isValid;
        isValid = this.validateMessage() && isValid;
        return isValid;
    },

    /* --------------------------------------------------------
       validateName()
       -------------------------------------------------------- */
    validateName() {
        const el = document.getElementById('contact-name');
        if (!el) return false;

        const value = el.value.trim();
        let msg = '';

        if (!value) {
            msg = 'Please enter your name.';
        } else if (value.length < 2) {
            msg = 'Name must be at least 2 characters.';
        } else if (!/^[a-zA-Z\s'-]+$/.test(value)) {
            msg = 'Name may only contain letters and spaces.';
        }

        return this.setFieldState(el, msg);
    },

    /* --------------------------------------------------------
       validateEmail()
       -------------------------------------------------------- */
    validateEmail() {
        const el = document.getElementById('contact-email');
        if (!el) return false;

        const value = el.value.trim();
        let msg = '';

        // Standard email regex (RFC-5322 simplified)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!value) {
            msg = 'Please enter your email address.';
        } else if (!emailRegex.test(value)) {
            msg = 'Please enter a valid email address (e.g. name@example.com).';
        }

        return this.setFieldState(el, msg);
    },

    /* --------------------------------------------------------
       validateSubject()
       -------------------------------------------------------- */
    validateSubject() {
        const el = document.getElementById('contact-subject');
        if (!el) return false;

        const value = el.value;
        let msg = '';

        if (!value) {
            msg = 'Please select a subject.';
        }

        return this.setFieldState(el, msg);
    },

    /* --------------------------------------------------------
       validateMessage()
       -------------------------------------------------------- */
    validateMessage() {
        const el = document.getElementById('contact-message');
        if (!el) return false;

        const value = el.value.trim();
        let msg = '';

        if (!value) {
            msg = 'Please enter a message.';
        } else if (value.length < 10) {
            msg = `Message must be at least 10 characters (currently ${value.length}).`;
        }

        this.updateCharCounter();
        return this.setFieldState(el, msg);
    },

    /* --------------------------------------------------------
       setFieldState(el, errorMsg)
       Applies Bootstrap validation classes and feedback text.
       Returns true when valid, false when invalid.
       -------------------------------------------------------- */
    /**
     * Locate the feedback element that belongs to a field.
     *
     * Fields wrapped in a Bootstrap .input-group must place their feedback
     * OUTSIDE the group — inside it, .invalid-feedback becomes a flex child and
     * is squeezed into a narrow column instead of appearing under the field.
     */
    getFeedbackElement(el) {
        const group = el.closest('.input-group');
        const scope = group ? group.parentElement : el.parentElement;
        if (!scope) return null;

        let feedback = null;
        for (const child of scope.children) {
            if (child.classList.contains('invalid-feedback')) {
                feedback = child;
                break;
            }
        }

        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            // Insert directly after the control (or its input group)
            const anchor = group || el;
            if (anchor.nextSibling) {
                scope.insertBefore(feedback, anchor.nextSibling);
            } else {
                scope.appendChild(feedback);
            }
        }

        if (!feedback.id) {
            feedback.id = `${el.id}-error`;
        }

        return feedback;
    },

    setFieldState(el, errorMsg) {
        const feedback = this.getFeedbackElement(el);

        if (errorMsg) {
            el.classList.remove('is-valid');
            el.classList.add('is-invalid');
            el.setAttribute('aria-invalid', 'true');
            if (feedback) {
                feedback.textContent = errorMsg;
                // Bootstrap's ~ selector cannot reach a feedback element that sits
                // outside the .input-group, so force visibility explicitly.
                feedback.classList.add('d-block');
                el.setAttribute('aria-describedby', feedback.id);
            }
            return false;
        }

        el.classList.remove('is-invalid');
        el.classList.add('is-valid');
        el.removeAttribute('aria-invalid');
        if (feedback) {
            feedback.textContent = '';
            feedback.classList.remove('d-block');
        }
        return true;
    },

    /* --------------------------------------------------------
       updateCharCounter()
       -------------------------------------------------------- */
    updateCharCounter() {
        const el = document.getElementById('contact-message');
        const counter = document.getElementById('message-char-counter');
        if (!el || !counter) return;

        const len = el.value.length;
        const min = 10;
        if (len < min) {
            counter.textContent = `${len} / ${min} minimum characters`;
            counter.className = 'text-danger d-block mt-1 small';
        } else {
            counter.textContent = `${len} characters`;
            counter.className = 'text-muted d-block mt-1 small';
        }
    },

    /* --------------------------------------------------------
       showSuccess()
       -------------------------------------------------------- */
    showSuccess() {
        const alertEl = document.getElementById('contact-success');

        if (alertEl) {
            alertEl.innerHTML = `
                <div class="d-flex align-items-start">
                    <i class="fas fa-check-circle fa-2x me-3 text-success mt-1"></i>
                    <div>
                        
                        <span>Message Sent!</span>
                      
                    </div>
                </div>`;

            alertEl.classList.remove('d-none');
            $(alertEl).hide().slideDown(400);

            // Auto-hide after 7 seconds
            setTimeout(() => {
                $(alertEl).slideUp(400, function () {
                    $(this).addClass('d-none');
                });
            }, 7000);
        }
    },

    /* --------------------------------------------------------
       resetForm()
       -------------------------------------------------------- */
    resetForm() {
        if (!this.form) return;

        this.form.reset();

        // Remove all validation classes and ARIA state
        this.form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
            el.removeAttribute('aria-invalid');
            el.removeAttribute('aria-describedby');
        });

        // Clear feedback messages
        this.form.querySelectorAll('.invalid-feedback').forEach(el => {
            el.textContent = '';
            el.classList.remove('d-block');
        });

        // Reset character counter
        this.updateCharCounter();
    }
};
