const socket = io();

const groupsList = document.getElementById('groupsList');
const contactsSelect = document.getElementById('contactsSelect');
const messagesBox = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const createGroupForm = document.getElementById('createGroupForm');
const addMemberBtn = document.getElementById('addMemberBtn');
const removeMemberBtn = document.getElementById('removeMemberBtn');
const makeAdminBtn = document.getElementById('makeAdminBtn');
const fileInput = document.getElementById('fileUpload');

const userId = sessionStorage.getItem('user_id');
const userName = sessionStorage.getItem('name');
const token = sessionStorage.getItem('token');

let groupId = sessionStorage.getItem('group_id') || null;

socket.emit('register', userId);

function storageKey() {
  return `chat_group_${groupId}`;
}

function renderMessages(messages) {
  messagesBox.innerHTML = '';
  messages.forEach(m => {
    const div = document.createElement('div');
    div.className = `message ${m.user === userName ? 'own' : 'other'}`;
    if (m.content.startsWith('http')) {
      div.innerHTML = `${m.user}: <a href="${m.content}" target="_blank">📎 File</a>`;
    } else {
      div.textContent = `${m.user}: ${m.content}`;
    }
    messagesBox.appendChild(div);
  });
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

async function loadGroups() {
  const res = await fetch(`/groups/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const groups = await res.json();
  groupsList.innerHTML = '';
  groups.forEach(g => {
    const li = document.createElement('li');
    li.textContent = g.name;
    li.onclick = () => {
      groupId = g.id;
      sessionStorage.setItem('group_id', groupId);
      loadMessages();
    };
    groupsList.appendChild(li);
  });
}

async function loadContacts() {
  const res = await fetch(`/groups/${userId}/contacts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const contacts = await res.json();
  contactsSelect.innerHTML = '';
  contacts.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.phone})`;
    contactsSelect.appendChild(opt);
  });
}

async function loadMessages() {
  if (!groupId) return;
  const res = await fetch(`/messages/${groupId}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 403) {
    alert(' You were removed from this group.');
    groupId = null;
    sessionStorage.removeItem('group_id');
    sessionStorage.removeItem(storageKey());
    messagesBox.innerHTML = '';
    return;
  }
  const messages = await res.json();
  sessionStorage.setItem(storageKey(), JSON.stringify(messages));
  renderMessages(messages);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!groupId) return alert('Select a group!');

  // Send text if any
  const content = input.value.trim();
  if (content) {
    socket.emit('chat message', {
      user_id: userId,
      group_id: groupId,
      content,
      user: userName
    });
    input.value = '';
  }

  
  if (fileInput.files.length) {
    const file = fileInput.files[0];
    const res = await fetch('/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type }),
    });
    const { uploadUrl, fileUrl } = await res.json();

    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    socket.emit('chat message', {
      user_id: userId,
      group_id: groupId,
      content: fileUrl,
      user: userName
    });

    fileInput.value = '';
  }
});

socket.on('chat message', async msg => {
  if (msg.group_id != groupId) return;

  const res = await fetch(`/groups/${groupId}/member/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!data.isMember) {
    console.log(' You were removed. Ignoring message.');
    return;
  }

  const all = JSON.parse(sessionStorage.getItem(storageKey())) || [];
  all.push(msg);
  sessionStorage.setItem(storageKey(), JSON.stringify(all));
  renderMessages(all);
});

socket.on('group_update', () => {
  loadGroups();
});

createGroupForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('groupName').value.trim();
  const selectedContacts = Array.from(contactsSelect.selectedOptions).map(opt =>
    Number(opt.value)
  );

  const res = await fetch('/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      created_by: Number(userId),
      contacts: selectedContacts
    })
  });

  if (res.status === 201) {
    alert('Group created!');
    createGroupForm.reset();
    await loadGroups();
  } else {
    alert(' Failed to create group.');
  }
});

addMemberBtn.onclick = async () => {
  const selected = contactsSelect.value;
  if (!groupId || !selected) return alert('Select group and contact!');
  const res = await fetch(`/groups/${groupId}/add-member`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ newUserId: Number(selected) })
  });
  if (res.ok) {
    alert(' Member added!');
  } else {
    alert(' Failed to add member.');
  }
};

removeMemberBtn.onclick = async () => {
  const selected = contactsSelect.value;
  if (!groupId || !selected) return alert('Select group and contact!');
  const res = await fetch(`/groups/${groupId}/remove-member`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ removeUserId: Number(selected) })
  });
  if (res.ok) {
    alert(' Member removed!');
  } else {
    alert(' Failed to remove member.');
  }
};

makeAdminBtn.onclick = async () => {
  const selected = contactsSelect.value;
  if (!groupId || !selected) return alert('Select group and contact!');
  const res = await fetch(`/groups/${groupId}/promote-member`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ promoteUserId: Number(selected) })
  });
  if (res.ok) {
    alert(' Made Admin!');
  } else {
    alert('Failed to promote.');
  }
};

loadGroups();
loadContacts();
if (groupId) loadMessages();
