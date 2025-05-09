const socket = io();

const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const roomSelection = document.getElementById('room-selection');
const roomList = document.getElementById('room-list');
const chatContainer = document.getElementById('chat-container');
const roomTitle = document.getElementById('room-title');
const changeRoomBtn = document.getElementById('change-room-btn');

let currentRoom = null;
let myUsername = null; // Variable to store the user's own username

// Listen for the assigned username
socket.on('user assigned', (username) => {
    myUsername = username;
    console.log(`Assigned username: ${myUsername}`);
});

// Listen for the list of rooms from the server
socket.on('room list', (rooms) => {
    roomList.innerHTML = ''; // Clear existing buttons
    rooms.forEach(room => {
        const button = document.createElement('button');
        button.textContent = room;
        button.addEventListener('click', () => {
            joinRoom(room);
        });
        roomList.appendChild(button);
    });
});

function joinRoom(roomName) {
    if (currentRoom === roomName) return; // Already in this room

    socket.emit('join room', roomName);
    currentRoom = roomName;

    // Update UI
    roomSelection.style.display = 'none';
    chatContainer.style.display = 'flex'; // Make sure this matches your CSS (flex for chat-container)
    roomTitle.textContent = `Chatting in: ${roomName}`;
    messages.innerHTML = ''; // Clear messages from previous room
    input.focus(); // Focus the input field
}

// Add event listener for the change room button
changeRoomBtn.addEventListener('click', () => {
    leaveCurrentRoom();
});

function leaveCurrentRoom() {
    if (!currentRoom) return; // Not in a room

    // Optionally: Emit an event to notify the server (implement server-side handler if needed)
    // socket.emit('leave room', currentRoom);

    // Reset UI
    chatContainer.style.display = 'none';
    roomSelection.style.display = 'block'; // Or 'flex' if you used that for room selection
    messages.innerHTML = ''; // Clear messages
    roomTitle.textContent = ''; // Clear title
    input.value = ''; // Clear input field

    // Clear local state
    const roomToLeave = currentRoom;
    currentRoom = null;

    // Optionally: Re-fetch or re-display room list if it could change
    // For now, we assume the room list is static after initial load
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value && currentRoom) { // Ensure user is in a room
    socket.emit("chat message", { room: currentRoom, text: input.value }); // Send room with message
    input.value = "";
  }
});

socket.on("message", function (data) {
  if (!currentRoom) return; // Don't display messages if not in a room

  const item = document.createElement("li");
  item.innerHTML = `<strong>${data.user}:</strong> ${data.text}`;

  // Add classes based on the sender
  if (data.user === myUsername) {
      item.classList.add('my-message');
  } else if (data.user === 'System') {
      item.classList.add('system-message');
  } else {
      item.classList.add('other-message'); // Optional class for others
  }

  messages.appendChild(item);

  // Animate the new message
  anime({
    targets: item,
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 500,
    easing: 'easeOutExpo'
  });

  messages.scrollTop = messages.scrollHeight;
});
