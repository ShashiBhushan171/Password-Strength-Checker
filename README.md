## Password Strength Checker 🔐

A web-based tool that helps users create strong passwords by evaluating complexity, showing real-time feedback, and estimating the time it would take to crack the password using brute force.  

### ✨ Features
- Real-time password strength feedback (Very Weak → Very Strong)  
- Checks for length, uppercase, lowercase, numbers, and special characters  
- Detects predictable patterns (e.g., `1234`, `qwerty`, `p@ssw0rd`)  
- Blocks common passwords (from `common_passwords.txt`)  
- Estimates crack time using a brute-force model (1B guesses/sec)  
- Built-in password generator with copy-to-clipboard  
- Clean and responsive UI 

### 🛠️ Tech Stack
- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Python (`http.server`, `socketserver`)  
- **Algorithms:** Regex pattern detection, Brute-force time estimation  
- **Architecture:** Strategy Pattern for password evaluation
