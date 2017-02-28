module.exports = {
    navigateFallback: '/index.html',
    root: 'dist',
    templateFilePath: "service-worker-custom.tmpl",
    skipWaiting: false,
    importScripts: ['service-worker-events.js'],
    ignoreUrlParametersMatching:[ /./],
    staticFileGlobs: [
        'dist/index.html',
        'dist/**/**',
        'dist/*.js'
    ]
};