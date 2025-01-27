export function setupAutoLogout() {
  let logoutInProgress = false;

  async function logout() {
    if (logoutInProgress) return;
    logoutInProgress = true;

    try {
      const response = await fetch('api/logout', { method: 'POST' });
      if (response.ok) {
        console.log('Logged out successfully');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      logoutInProgress = false;
    }
  }

  window.addEventListener('beforeunload', (event) => {
    logout();
    // Uncomment the following line if you want to show a confirmation dialog
    // event.returnValue = '';
  });
}
