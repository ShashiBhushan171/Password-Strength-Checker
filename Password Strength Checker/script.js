let currentController = null;
function checkPassword() {
  const password = document.getElementById('password').value;
  const defaults = {
    length: 'Length: at least 8 characters',
    uppercase: 'Contains uppercase letters',
    lowercase: 'Contains lowercase letters',
    specialChars: 'Contains special characters',
    numbers: 'Contains numbers',
    strength: '',
    time_to_crack: '',
  };
  if (password.trim() === "") {
    ['length', 'uppercase', 'lowercase', 'specialChars', 'numbers'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.color = '#555';
        el.textContent = defaults[id];
      }
    });
    const strengthDisplay = document.getElementById('strength');
    if (strengthDisplay) {
      strengthDisplay.textContent = defaults.strength;
      strengthDisplay.style.color = '#555';
    }
    const timeToCrack = document.getElementById('time_to_crack');
    if (timeToCrack) {
      timeToCrack.textContent = defaults.time_to_crack;
      timeToCrack.style.color = '#555';
    }
    const note = document.getElementById('note');
    if (note) {
      note.style.display = 'none';
      note.style.color = '#555';
    }
    if (currentController) {
      currentController.abort();
    }
    return;
  }
  if (currentController) {
    currentController.abort();
  }
  currentController = new AbortController();
  const { signal } = currentController;
  const validate = (regex, elementId, defaultText) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.color = regex.test(password) ? 'green' : 'red';
      element.textContent = defaultText;
    }
  };
  // 1. Check length
  const lengthCheck = document.getElementById('length');
  if (lengthCheck) {
    lengthCheck.style.color = password.length >= 8 ? 'green' : 'red';
    lengthCheck.textContent = `Length: ${password.length}`;
  }
  validate(/[A-Z]/, 'uppercase', defaults.uppercase);
  validate(/[a-z]/, 'lowercase', defaults.lowercase);
  validate(/[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>\/?]/, 'specialChars', defaults.specialChars);
  validate(/\d/, 'numbers', defaults.numbers);
  const payload = {
    action: 'evaluate_password',
    password: password
  };
  fetch('http://localhost:8000', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: signal
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Network response was not ok.');
    })
    .then(data => {
      currentController = null;
      const strengthDisplay = document.getElementById('strength');
      if (strengthDisplay) {
        strengthDisplay.textContent = `Password strength: ${data.strength}`;
        strengthDisplay.style.color =
          data.strength === 'Strong' ? 'green' :
          data.strength === 'Medium' ? 'orange' : 'red';
      }
      const timeToCrack = document.getElementById('time_to_crack');
      const note = document.getElementById('note');
      const noTime = !data.time_to_crack || data.time_to_crack.includes('0 years, 0 days');
      if (timeToCrack && note) {
        if (noTime) {
          timeToCrack.textContent = '';
          note.style.display = 'block';
          note.style.color = 'red';
        } else {
          timeToCrack.textContent = `Estimated time to crack: ${data.time_to_crack}`;
          timeToCrack.style.color = 'green';
          note.style.display = 'none';
        }
      }
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
      }
    });
}