// WebSocket connection
const ws = new WebSocket('ws://localhost:8080');

let typingTimeout;

const modal = document.getElementById('modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.querySelector('.close');
const confirmBtn = document.getElementById('confirm-btn');
const chat = document.getElementById('chat');
const mainContent = document.getElementById('main-content');
const userListDiv = document.getElementById('user-list');
const usersUl = document.getElementById('users');
const exitButton = document.getElementById('exit-button');
const sendBtn = document.getElementById('send-btn');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const typingNotification = document.createElement('div');
typingNotification.id = 'typing-notification';
typingNotification.style.fontStyle = 'italic';
messagesDiv.appendChild(typingNotification);

let username = '';
let mensagensChat = []

openModalBtn.onclick = function() {
    modal.style.display = 'block';
}

closeModalBtn.onclick = function() {
    modal.style.display = 'none';
}

confirmBtn.onclick = function() {
    const input = document.getElementById('username-input').value;
    if (input) {
        username = input;    
        ws.send(JSON.stringify({ type: 'new-user', username: username }));
    } else {
        alert('Por favor, insira seu nome.');
    }
}

exitButton.onclick = function() {
    ws.send(JSON.stringify({ type: 'disconnect', username: username }));
    ws.close();

    chat.classList.add('hidden');
    userListDiv.classList.add('hidden')
    mainContent.style.display = 'block';
    username = '';
};


sendBtn.onclick = function() {
    const message = messageInput.value;

    if (message) {
        if(message.startsWith('/private')){
            debugger
            let [command, ...messageTyped] = message.split(' ')
            let userToSend = command.split('-')[1]
            ws.send(JSON.stringify({ type: 'private-message', from: username, to: userToSend, message: messageTyped.join(' '),  }));
        }else{
            ws.send(JSON.stringify({ type: 'message', username: username, message: message }));
        }
        
        ws.send(JSON.stringify({ type: 'stopped-typing', username: username }));
        messageInput.value = '';
        typingNotification.textContent = '';
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

messageInput.addEventListener('input', () => {
    if(messageInput.value){
        ws.send(JSON.stringify({ type: 'typing', username: username }));
    }else{
        ws.send(JSON.stringify({ type: 'stopped-typing', username: username }));
    }
});

// Recebendo mensagens do servidor
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);

    if (data.type === 'error') {
        alert(data.message); 
    } else if (data.type === 'user-list') {
        atualizarListaUsuarios(data.users);
    } else if (data.type === 'disconnect') {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${data.username} se desconectou`;
        messagesDiv.appendChild(messageElement);
        mensagensChat.push({ type: "disconnect", mensagem: messageElement.textContent });
    } else if (data.type === 'new-user') {
        
        if(data.username == username){
            pegarHistorico()
            modal.style.display = 'none';
            mainContent.style.display = 'none';
            chat.classList.remove('hidden');
            userListDiv.classList.remove('hidden')
        }

        if(`${data.username} entrou no chat.` != messagesDiv.lastChild.textContent){
            const userMessageElement = document.createElement('div');
            userMessageElement.textContent = `${data.username} entrou no chat.`;
            messagesDiv.appendChild(userMessageElement);
            mensagensChat.push({ type: "new-user", mensagem: userMessageElement.textContent });
        }
      
    } else if (data.type === 'message') {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${data.username}: ${data.message}`;
        messagesDiv.appendChild(messageElement);
        mensagensChat.push({ type: "message", mensagem: messageElement.textContent });
    } else if (data.type === 'typing') {
        typingNotification.textContent = `${data.username} está digitando...`;
    } else if (data.type === 'stopped-typing') {
        typingNotification.textContent = '';
    } else if (data.type === 'private-message') {
        const privateMessageElement = document.createElement('div');
        if (data.from === username) {
            privateMessageElement.textContent = `[Privado para ${data.to}] Você: ${data.message}`;
        } else {
            privateMessageElement.textContent = `[Privado de ${data.from}] ${data.message}`;
        }
        messagesDiv.appendChild(privateMessageElement);
        mensagensChat.push({"type": "private-message", "mensagem": privateMessageElement.textContent, from: data.from, to: data.to});
    }

    localStorage.setItem("Mensagens", JSON.stringify(mensagensChat));
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


function pegarHistorico(){
    if(localStorage.getItem("Mensagens") != null){
        mensagensChat = JSON.parse(localStorage.getItem("Mensagens"))
        mensagensChat.forEach(x => {
            debugger
            if(x.type == "private-message"){
                if(username == x.to || username == x.from){
                    const messageElement = document.createElement('div');
                    messageElement.textContent = x.mensagem
                    messagesDiv.appendChild(messageElement);
                }
            }else{
                const messageElement = document.createElement('div');
                messageElement.textContent = x.mensagem
                messagesDiv.appendChild(messageElement);
            }
        })
    }
    
}

function atualizarListaUsuarios(users) {
    usersUl.innerHTML = '';
    users.forEach(user => {
        const userLi = document.createElement('li');
        userLi.textContent = user;
        usersUl.appendChild(userLi);
    });
}



