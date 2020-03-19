const requireDir = require('require-dir');
const jsons = requireDir('../mochawesome-report');

const APP_BRANCH = process.env.APP_BRANCH || 'master';
const API_BRANCH = process.env.API_BRANCH || 'master';
const MATRICULACIONES_BRANCH = process.env.MATRICULACIONES_BRANCH || 'master';
const MONITOREO_BRANCH = process.env.MONITOREO_BRANCH || 'master';
const TEST_BRANCH = process.env.TEST_BRANCH || 'master';

const BUILD_ID = parseInt(process.env.BUILD_NUMBER, 10) || Math.round(Math.random() * 100);

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200' })

let index;
let start = '';

function toBase64(string) {
    const buf = Buffer.from(string);
    return buf.toString('base64');
}

async function main() {
    for (let key in jsons) {
        index = 'jenkins-' + jsons[key].stats.start.substring(0, 10);
        start = jsons[key].stats.start;
        for (let item of jsons[key].results) {
            await letseetest(item, []);
        }
    }
}


async function letseetest(test, titles) {
    if (test.suites) {
        for (let item of test.suites) {
            await letseetest(item, [...titles, test.title]);
        }
    }
    if (test.tests) {
        for (let item of test.tests) {
            await letseetest(item, [...titles, test.title]);
        }
    }
    if (test.state) {
        let context = JSON.parse(test.context);
        context = Array.isArray(context) ? context : [context];
        const fileItem = context.find(item => item.title === 'Filename');
        const fileName = fileItem.value;

        titles.shift();
        const titulos = [...titles, test.title];

        delete test['context'];

        const body = {
            ...test,
            fullTitle: titulos.join(' | '),
            titulos,
            start,
            fileName,
            APP_BRANCH,
            API_BRANCH,
            MATRICULACIONES_BRANCH,
            MONITOREO_BRANCH,
            BUILD_ID,
            TEST_BRANCH,
            test_id: toBase64(titulos.join(' | '))
        }

        await client.index({ index, type: 'test', body })
    }
}

main(); 