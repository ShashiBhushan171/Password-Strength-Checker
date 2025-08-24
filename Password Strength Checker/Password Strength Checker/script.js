// ✅ Wait for the DOM to be fully loaded before running any script
document.addEventListener("DOMContentLoaded", () => {
  // ✅ Store all DOM element references in one place to avoid repeated queries
  const elements = {
    passwordInput: document.getElementById("password"),
    togglePasswordBtn: document.getElementById("togglePassword"),
    generatePasswordBtn: document.getElementById("generatePassword"),
    copyPasswordBtn: document.getElementById("copyPassword"),
    strengthDisplay: document.getElementById("strength"),
    timeToCrackDisplay: document.getElementById("time_to_crack"),
    noteDisplay: document.getElementById("note"),
    criteria: {
      length: document.getElementById("length"),
      uppercase: document.getElementById("uppercase"),
      lowercase: document.getElementById("lowercase"),
      specialChars: document.getElementById("specialChars"),
      numbers: document.getElementById("numbers"),
    },
  };

  // ✅ Default text for UI elements
  const defaults = {
    length: 'Length: at least 8 characters',
    uppercase: 'Contains uppercase letters',
    lowercase: 'Contains lowercase letters',
    specialChars: 'Contains special characters',
    numbers: 'Contains numbers',
  };
  
  // State management variables
  let currentController = null;
  let typingTimeout = null;

  // --- UTILITY FUNCTIONS ---

  /**
   * Maps a password strength string to a specific color.
   * @param {string} strength - The strength level (e.g., 'Weak', 'Strong').
   * @returns {string} A hex color code.
   */
  function getStrengthColor(strength) {
    const colors = {
      'Very Weak': '#9c0a0aff',
      'Weak': '#c04e0cff',
      'Moderate': '#b1b70eff',
      'Good': '#0ba410ff',
      'Strong': '#1844a2ff',
      'Very Strong': '#821b9cff',
    };
    return colors[strength] || '#555';
  }

  /**
   * Resets the entire UI to its default state.
   */
  function resetUI() {
    for (const key in elements.criteria) {
      const el = elements.criteria[key];
      if (el) {
        el.style.color = '#555';
        el.textContent = defaults[key];
      }
    }
    if (elements.strengthDisplay) {
      elements.strengthDisplay.textContent = '';
      elements.strengthDisplay.style.color = '#555';
    }
    if (elements.timeToCrackDisplay) {
      elements.timeToCrackDisplay.textContent = '';
    }
    if (elements.noteDisplay) {
      elements.noteDisplay.style.display = 'none';
    }
  }

  /**
   * Updates the UI with data from the backend.
   * @param {object} data - The response data from the fetch request.
   */
  function updateUI(data) {
    if (elements.strengthDisplay) {
      elements.strengthDisplay.textContent = `Password strength: ${data.strength}`;
      elements.strengthDisplay.style.color = getStrengthColor(data.strength);
    }

    const noTimeAvailable = !data.time_to_crack || data.time_to_crack.includes('0 years, 0 days');

    if (elements.timeToCrackDisplay && elements.noteDisplay) {
      if (noTimeAvailable) {
        elements.timeToCrackDisplay.textContent = '';
        elements.noteDisplay.style.display = 'block';
        elements.noteDisplay.style.color = 'red';
      } else {
        elements.timeToCrackDisplay.textContent = `Estimated time to crack: ${data.time_to_crack}`;
        elements.timeToCrackDisplay.style.color = 'green';
        elements.noteDisplay.style.display = 'none';
      }
    }
  }

  /**
   * Validates the password against a regex and updates the corresponding UI element.
   * @param {RegExp} regex - The regular expression to test against.
   * @param {HTMLElement} element - The DOM element to update.
   * @param {string} password - The current password string.
   */
  function validateCriteria(regex, element, password) {
    if (element) {
      element.style.color = regex.test(password) ? 'green' : 'red';
    }
  }

  // --- CORE LOGIC ---

  /**
   * The main function to evaluate the password. It handles UI updates and the backend API call.
   */
  function evaluatePassword() {
    const password = elements.passwordInput.value;

    // Abort any previous fetch request if a new one is starting
    if (currentController) {
      currentController.abort();
    }
    
    // If input is empty, reset everything and stop
    if (password.trim() === "") {
      resetUI();
      return;
    }

    // --- Client-side Validation (for immediate feedback) ---
    if (elements.criteria.length) {
      elements.criteria.length.style.color = password.length >= 8 ? 'green' : 'red';
      elements.criteria.length.textContent = `Length: ${password.length}`;
    }
    validateCriteria(/[A-Z]/, elements.criteria.uppercase, password);
    validateCriteria(/[a-z]/, elements.criteria.lowercase, password);
    validateCriteria(/[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>\/?]/, elements.criteria.specialChars, password);
    validateCriteria(/\d/, elements.criteria.numbers, password);

    // --- Backend API Call ---
    currentController = new AbortController();
    const { signal } = currentController;
    const payload = { action: 'evaluate_password', password: password };

    fetch('http://localhost:8000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: signal
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      updateUI(data);
      currentController = null;
    })
    .catch(error => {
      // Don't log an error if the request was intentionally aborted
      if (error.name !== 'AbortError') {
        console.error('There was a problem with the fetch operation:', error);
      }
    });
  }

  /**
   * A debounced wrapper for evaluatePassword to prevent it from running on every keystroke.
   */
  function debouncedCheckPassword() {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(evaluatePassword, 300); // 300ms delay
  }

  // --- EVENT LISTENERS ---

  // ❗ CRITICAL FIX: This listener was missing in the original code.
  // It triggers the password evaluation as the user types.
  if (elements.passwordInput) {
    elements.passwordInput.addEventListener('input', debouncedCheckPassword);
  }

  // Toggle password visibility (show/hide)
  if (elements.togglePasswordBtn) {
    elements.togglePasswordBtn.addEventListener("click", function () {
      const isPassword = elements.passwordInput.type === "password";
      elements.passwordInput.type = isPassword ? "text" : "password";
      this.textContent = isPassword ? "Hide" : "Show";
    });
  }

  // Generate a new password
  if (elements.generatePasswordBtn) {
    elements.generatePasswordBtn.addEventListener("click", () => {
      // Assumes generatePassword() and copyToClipboard() are in another file (e.g., generate.js)
      // and included in your HTML before this script.
      if (typeof generatePassword === 'function') {
        elements.passwordInput.value = generatePassword(12);
        evaluatePassword(); // Evaluate immediately, no need to debounce a click
      } else {
        console.error('generatePassword function not found.');
      }
    });
  }

  // Copy the password to the clipboard
  if (elements.copyPasswordBtn) {
    elements.copyPasswordBtn.addEventListener("click", () => {
      if (elements.passwordInput.value && typeof copyToClipboard === 'function') {
        copyToClipboard(elements.passwordInput.value);
      } else if (typeof copyToClipboard !== 'function') {
        console.error('copyToClipboard function not found.');
      }
    });
  }
});