document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    name: e.target.name.value,
    email: e.target.email.value,
    phone: e.target.phone.value,
    password: e.target.password.value
  };

  const res = await fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  const data = await res.json();

  if (res.status === 201) {
    alert('Signed up!');
    window.location.href = '/login';
  } else {
    alert(` ${data.message}`);
  }
});
