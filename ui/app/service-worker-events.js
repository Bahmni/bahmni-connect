self.addEventListener('message', function (event) {
    if (event.data.type == 'checkForMultipleClients') {
        self.clients.matchAll({type: 'window'}).then(function (clients) {
            clients.forEach(function (client) {
                client.postMessage({
                    type: 'checkForMultipleClients',
                    data: clients.length > 1
                });
            });
        });
    }
});
