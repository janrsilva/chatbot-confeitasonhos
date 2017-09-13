// Importa as dependências
let auth = require('./config/auth');
let MessagingHub = require('messaginghub-client');
let WebSocketTransport = require('lime-transport-websocket');
const identifier = auth.identifier;
const key = auth.key;

// Cria uma instância do cliente, informando o identifier e accessKey do seu chatbot 
let client = new MessagingHub.ClientBuilder()
    .withIdentifier(identifier)
    .withAccessKey(key)
    .withTransportFactory(() => new WebSocketTransport())
    .build();

// Registra um receiver para mensagens do tipo 'text/plain'
client.addMessageReceiver(true, function (message) {
    // TODO: Processe a mensagem recebida
    log(message);
    let command = {  
        "id": message.id,
        "to": "postmaster@ai.msging.net",
        "method": "set",
        "uri": "/analysis",
        "type": "application/vnd.iris.ai.analysis-request+json",
        "resource": {
            "text": message.content
        }
    };
    client.sendCommand(command).then(function(response) {
        log(response);
        if(response.resource.intentions.length){
            let id = response.resource.intentions[0].id;
            client.sendCommand({  
                "id": id,
                "to": "postmaster@ai.msging.net",
                "method": "get",
                "uri": "/intentions/"+id+"/answers"
            }).then(function(intention) {
                log(intention);
                if(intention.resource.items.length){
                    var rand = intention.resource.items[Math.floor(Math.random() * intention.resource.items.length)];
                    var resposta = rand.value.replace("#", "");
                    var index = rand.value.indexOf("#");
                    
                    let msg;
                    if(index == -1){
                        msg = { type: "text/plain", content: resposta, to: message.from };
                    } else {
                        msg = {
                            to: message.from,
                            type: "application/vnd.iris.resource+json",
                            content: {
                                key: resposta
                            }
                        };
                    }

                    client.sendMessage(msg);
                    log("mandei a mensagem >>>>> " + rand.value + " >>>>> " + message.from);
                }
            });
        }
    });
});

// Registra um receiver para qualquer notificação
client.addNotificationReceiver(true, function(notification) {
  // TODO: Processe a notificação recebida
});

// Conecta com o servidor de forma assíncrona. 
// A conexão ocorre via websocket, na porta 443.
client.connect()  // O retorno deste método é uma 'promise'.
    .then(function (session) {
        // Conexão bem sucedida. A partir deste momento, é possível enviar e receber envelopes do servidor. */ 
        console.log('Connectado');
    })
    .catch(function (err) {
        // Falha na conexão
        console.log(err);
    });

    function log(valor){
        console.log("<<-->>");
        console.log(valor);
    }