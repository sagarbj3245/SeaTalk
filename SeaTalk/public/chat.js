const socket = io();

const userId = sessionStorage.getItem('user_id');
const userName = sessionStorage.getItem('name');
const token = sessionStorage.getItem('token');

socket.emit('register', userId);

const contactsList = document.getElementById('contactsList');
const messagesBox = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const addContactForm = document.getElementById('addContactForm');
const fileInput = document.getElementById('fileUpload');

let selectedContactId = sessionStorage.getItem('contact_id') || null;
let selectedFile = null;

function storageKey() {
  return `chat_direct_${selectedContactId}`;
}

function renderMessages(messages) {
  messagesBox.innerHTML = '';
  messages.forEach(m => {
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(m.sender === userName ? 'own' : 'other');

    if (m.content.startsWith('http')) {
      div.innerHTML = `${m.sender}: <a href="${m.content}" target="_blank">📎 File</a>`;
    } else {
      div.textContent = `${m.sender}: ${m.content}`;
    }

    messagesBox.appendChild(div);
  });
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function createContactListItem(c) {
  const li = document.createElement('li');
  li.dataset.id = c.id;

  const span = document.createElement('span');
  span.textContent = `${c.name} (${c.phone})`;
  span.style.flex = '1';
  span.style.cursor = 'pointer';
  span.onclick = () => {
    selectedContactId = c.id;
    sessionStorage.setItem('contact_id', c.id);
    loadMessages();
  };

  const delBtn = document.createElement('button');
  delBtn.textContent = 'Delete';
  delBtn.className = 'delete-btn';
  delBtn.onclick = async (e) => {
    e.stopPropagation();
    if (confirm(`Delete ${c.name}?`)) {
      const resp = await fetch(`/direct/contact/${c.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        li.remove();
        alert('Contact deleted.');
      } else {
        alert('Failed to delete contact.');
      }
    }
  };

  li.style.display = 'flex';
  li.style.justifyContent = 'space-between';
  li.style.alignItems = 'center';

  li.appendChild(span);
  li.appendChild(delBtn);

  return li;
}

async function loadContacts() {
  const res = await fetch(`/contacts/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const contacts = await res.json();
  contactsList.innerHTML = '';
  contacts.forEach(c => {
    contactsList.appendChild(createContactListItem(c));
  });
}

async function loadMessages() {
  if (!selectedContactId) return;
  const res = await fetch(`/direct/${userId}/${selectedContactId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const messages = await res.json();
  sessionStorage.setItem(storageKey(), JSON.stringify(messages));
  renderMessages(messages);
}

fileInput.addEventListener('change', (e) => {
  selectedFile = e.target.files[0] || null;
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!selectedContactId) {
    alert('Select a contact first!');
    return;
  }

  if (selectedFile) {
    const res = await fetch('/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: selectedFile.name, fileType: selectedFile.type }),
    });
    const { uploadUrl, fileUrl } = await res.json();

    await fetch(uploadUrl, {
      method: 'PUT',
      body: selectedFile,
      headers: { 'Content-Type': selectedFile.type }
    });

    socket.emit('direct message', {
      from: userId,
      to: selectedContactId,
      content: fileUrl
    });

    selectedFile = null;
    fileInput.value = '';

  } else {
    const content = input.value.trim();
    if (!content) return;

    socket.emit('direct message', {
      from: userId,
      to: selectedContactId,
      content
    });

    input.value = '';
  }
});

socket.on('direct message', msg => {
  const key = msg.from == userId ? msg.to : msg.from;
  const storeKey = `chat_direct_${key}`;
  const all = JSON.parse(sessionStorage.getItem(storeKey)) || [];
  all.push(msg);
  sessionStorage.setItem(storeKey, JSON.stringify(all));

  if (!document.querySelector(`#contactsList li[data-id="${msg.from}"]`) && msg.from != userId) {
  
    const li = createContactListItem({
      id: msg.from,
      name: msg.sender,
      phone: msg.phone
    });
    contactsList.appendChild(li);
  }

  if (selectedContactId == key) {
    renderMessages(all);
  }
});

addContactForm.addEventListener('submit', async e => {
  e.preventDefault();
  const phone = e.target.phone.value.trim();
  if (!phone) return;

  const res = await fetch('/contacts/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ contact_phone: phone })
  });

  const data = await res.json();
  if (res.status === 201) {
    alert('Contact added!');
    addContactForm.reset();
    loadContacts();
  } else {
    alert(data.message);
  }
});

document.getElementById('groupsBtn').addEventListener('click', () => {
  window.location.href = '/group';
});

loadContacts();
if (selectedContactId) loadMessages();
