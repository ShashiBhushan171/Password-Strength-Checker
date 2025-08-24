/**
 * Generates a cryptographically secure random password.
 * @param {number} [length=12] - The desired length of the password.
 * @returns {string} The generated password.
 */
function generatePassword(length = 12) {
  // A comprehensive character set for strong passwords
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?";
  let password = "";

  // Use the secure Crypto API to generate random values
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    // Use the random value to pick a character from the charset
    password += charset[randomValues[i] % charset.length];
  }
  return password;
}

/**
 * Copies the given text to the user's clipboard.
 * @param {string} text - The text to be copied.
 */
function copyToClipboard(text) {
  // Use the modern, promise-based Navigator Clipboard API
  navigator.clipboard.writeText(text).then(() => {
    showToast("✅ Password copied to clipboard!");
  }).catch(err => {
    console.error("Could not copy text: ", err);
    showToast("⚠️ Failed to copy password!");
  });
}

/**
 * Displays a temporary "toast" notification on the screen.
 * @param {string} message - The message to display in the toast.
 */
function showToast(message) {
  // Create the toast element dynamically
  const toast = document.createElement("div");
  toast.textContent = message;

  // Apply styles directly via JavaScript
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#333',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '8px',
    zIndex: '1000',
    fontSize: '14px',
    opacity: '0', // Start with 0 opacity for fade-in
    transition: 'opacity 0.4s ease-in-out',
  });

  document.body.appendChild(toast);

  // Fade in, wait, then fade out
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10); // Short delay to allow the element to be in the DOM before transitioning

  setTimeout(() => {
    toast.style.opacity = '0';
    // Remove the element from the DOM after the fade-out transition completes
    toast.addEventListener('transitionend', () => toast.remove());
  }, 2500); // Display the toast for 2.5 seconds
}