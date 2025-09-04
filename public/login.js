// login.js
// Simple user login/logout logic using localStorage

// Create new account (username only)
function createAccount(username) {
  if (!username) return false;
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  if (users.includes(username)) return false; // already exists
  users.push(username);
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', username);
  // Set blank profile pic for this user
  localStorage.setItem(`profilePic_${username}`, '');
  // Remove all transaction records and friends for this user
  localStorage.setItem(`tcharts_${username}`, '{}');
  localStorage.setItem(`friends_${username}`, '[]');
  return true;
}

// Login (username only)
function login(username) {
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  if (!users.includes(username)) return false;
  localStorage.setItem('currentUser', username);
  return true;
}

// Logout
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// Get current user
function getCurrentUser() {
  return localStorage.getItem('currentUser') || null;
}

// For demo: auto-login as Cza if no user
if (!getCurrentUser()) {
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  if (!users.includes('Cza')) {
    createAccount('Cza');
  } else {
    login('Cza');
  }
}
