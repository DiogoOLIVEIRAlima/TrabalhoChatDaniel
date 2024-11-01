import WebSocket, { WebSocketServer } from 'ws';

const wsServer = new WebSocketServer({ port: 8080 });
const connectedUsers = new Set();



wsServer.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    const parsedData = JSON.parse(data);

    if (parsedData.type === 'new-user') {
      if (connectedUsers.has(parsedData.username)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Nome de usuário já está em uso. Escolha outro nome.' }));
      } else {
        ws.username = parsedData.username;
        connectedUsers.add(parsedData.username);
          
        mandarMensagem(JSON.stringify({
          type: 'new-user',
          username: parsedData.username,
          isFirstUser: connectedUsers.size == 1
        }));
        
        atualizarListaUsuarios();
      }
      
    } else if (parsedData.type === 'message') {
      mandarMensagem(JSON.stringify({
        type: 'message',
        username: parsedData.username,
        message: parsedData.message
      }));
    } else if (parsedData.type === 'disconnect') {
      if (ws.username) {
        connectedUsers.delete(ws.username);
        mandarMensagem(JSON.stringify({
          type: 'disconnect',
          username: ws.username
        }));
        atualizarListaUsuarios();
      }
    } else if (parsedData.type === 'typing') {
      mandarMensagem(JSON.stringify({
        type: 'typing',
        username: parsedData.username
      }));
    } else if (parsedData.type === 'stopped-typing') {
      mandarMensagem(JSON.stringify({
        type: 'stopped-typing',
        username: parsedData.username
      }));
    } else if (parsedData.type === "private-message"){
      const recipient = parsedData.to;
      const recipientWs = Array.from(wsServer.clients).find(client => client.username === recipient);
      const privateMessage = JSON.stringify({
        type: 'private-message',
        from: parsedData.from,
        to: parsedData.to,
        message: parsedData.message
      });

      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        recipientWs.send(privateMessage);
      }
      
      ws.send(privateMessage);
    }
  });

  ws.on('close', function() {
    if (ws.username) {
      connectedUsers.delete(ws.username);
      atualizarListaUsuarios();
    }
  });
});


function mandarMensagem(data) {
  wsServer.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}


function atualizarListaUsuarios() {
  mandarMensagem(JSON.stringify({
    type: 'user-list',
    users: Array.from(connectedUsers) // Converte o Set para uma Array
  }));
}

console.log('Servidor WebSocket rodando na porta 8080');
