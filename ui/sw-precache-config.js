module.exports = {
    navigateFallback: '/index.html',
    root: 'dist',
    ignoreUrlParametersMatching:[ /./],
    staticFileGlobs: [
        'dist/index.html',
        'dist/**/**'
    ]
};