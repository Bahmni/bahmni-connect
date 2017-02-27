var registerServiceWorker = function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
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
                            window.location = "home/index.html";
                            break;
                        case 'installed':
                            window.location = "home/index.html";
                            break;
                        }
                    };
                };
                if (registration.active && registration.active.state == 'activated') {
                    window.location = "home/index.html";
                }
                else {
                    console.log('Yey!', registration);
                }
            }).catch(function (e) {
                console.log('Error during service worker registration:', e);
                retryServiceWorkerDownload();
            });
    }
    else {
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

registerServiceWorker();
