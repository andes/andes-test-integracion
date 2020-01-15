
const { merge } = require('mochawesome-merge')
const marge = require('mochawesome-report-generator')


const reporterOptions = {
    reportDir: './mochawesome-report/web',
}
generateReport(reporterOptions)

function generateReport(options) {
    return merge(options).then((report) => {
        marge.create(report, options)
    })
}