document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    email: e.target.email.value,
    password: e.target.password.value
  };

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  const data = await res.json();

  if (res.status === 200) {
    alert('Login successful!');
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('user_id', data.user.id);
    sessionStorage.setItem('name', data.user.name);
    window.location.href = '/chat';
  } else {
    alert(` ${data.message}`);
  }
});
