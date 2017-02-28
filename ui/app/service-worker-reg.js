var registerServiceWorker = function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(checkForMultipleClients)
            .then(function (registration) {
                registration.onupdatefound = function () {
                    var installingWorker = registration.installing;
                    installingWorker.onstatechange = function () {
                        switch (installingWorker.state) {
                        case 'redundant':
                            if (!navigator.serviceWorker.controller) {
                                retryServiceWorkerDownload();
                            }
                            break;
                        case 'activated':
                            window.location = "offline/index.html#/device/chrome-app";
                            break;
                        case 'installed':
                            window.location = "offline/index.html#/device/chrome-app";
                            break;
                        }
                    };
                };
                if (registration.active && registration.active.state == 'activated') {
                    window.location = "offline/index.html#/device/chrome-app";
                }
                else {
                    console.log('Yey!', registration);
                }
            }).catch(function (e) {
                if (e == 'multipleTabsAreOpen') {
                    window.alert("close the other tabs");
                } else {
                    console.log('Error during service worker registration:', e);
                    retryServiceWorkerDownload();
                }
            });
    } else {
        console.log("serviceWorker is not supported in this browser.");
    }
};

var retryServiceWorkerDownload = function () {
    var failCount = window.sessionStorage.getItem("serviceWorkerFailCount") || 0;
    if (failCount < 3 && navigator.onLine) {
        failCount = parseInt(failCount) + 1;
        window.sessionStorage.setItem("serviceWorkerFailCount", failCount);
        console.log("Retrying serviceWorker install for ", failCount);
        registerServiceWorker();
    }
    else {
        console.log("session timed out");
    }
};

var addListener = function (type, callback) {
    navigator.serviceWorker.addEventListener('message', registerMessageCallback(type, callback));
};

var registerMessageCallback = function (messageType, callback) {
    return function (event) {
        if (event.data.type === messageType) {
            callback(event.data.data);
        }
    };
};

var checkForMultipleClients = function (registration) {
    serviceWorker = registration.active;
    if (serviceWorker) {
        serviceWorker.postMessage({type: 'checkForMultipleClients', data: undefined});
        return new Promise(function (resolve, reject) {
            addListener('checkForMultipleClients', function (multipleTabsAreOpen) {
                if (!multipleTabsAreOpen) {
                    resolve(registration);
                } else {
                    reject('multipleTabsAreOpen');
                }
            });
        });
    } else {
        return registration;
    }
};

registerServiceWorker();
