module.exports = {
    navigateFallback: '/index.html',
    root: 'dist',
    templateFilePath: "service-worker-custom.tmpl",
    skipWaiting: false,
    ignoreUrlParametersMatching:[ /./],
    staticFileGlobs: [
        'dist/index.html',
        'dist/**/**',
        'dist/*.js'
    ]
};