
const { merge } = require('mochawesome-merge')
const marge = require('mochawesome-report-generator')


const reporterOptions = {
    reportDir: './mochawesome-report/web',
}
generateReport(reporterOptions).catch((error) => {
    console.error(error)
    process.exit(1)
})

function generateReport(options) {
    return merge(options).then((report) => marge.create(report, options))
}