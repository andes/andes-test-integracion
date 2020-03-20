const fs = require('fs');
const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/rest");


const PRIVATE_KEY = fs.readFileSync(process.env.GITHUB_PRIVATE_KEY, 'utf8');
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const APP_ID = process.env.GITHUB_APP_ID;
const INSTALATION_ID = process.env.GITHUB_INSTALATION_ID;

const APP_BRANCH = process.env.APP_BRANCH || 'master';
const API_BRANCH = process.env.API_BRANCH || 'master';
const MATRICULACIONES_BRANCH = process.env.MATRICULACIONES_BRANCH || 'master';
const MONITOREO_BRANCH = process.env.MONITOREO_BRANCH || 'master';
const TEST_BRANCH = process.env.TEST_BRANCH || 'master';

const BUILD_ID = parseInt(process.env.BUILD_NUMBER, 10) || Math.round(Math.random() * 100);

async function publishComment(result, repo, branch) {
    if (branch === 'master') return;
    console.log('POSTING COMNENTS ON', repo, branch)
    const authData = {
        id: APP_ID,
        privateKey: PRIVATE_KEY,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
    };

    const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: authData
    });

    const { token } = await appOctokit.auth({
        type: "installation",
        installationId: INSTALATION_ID
    });

    const octokit = new Octokit({
        auth: token
    });

    const prs = await octokit.pulls.list({
        owner: 'andes',
        repo: repo,
        state: 'open',
        head: `andes/${repo}:${branch}`
    });

    if (prs.data.length > 0) {
        const pr = prs.data[0];

        await octokit.pulls.createReview({
            owner: 'andes',
            repo,
            pull_number: pr.number,
            body: createStatsText(result),
            event: 'COMMENT'
        })
    }

}

function createStatsText(stats) {
    return `
BUILD NUMBER: ${BUILD_ID}
TEST START: ${stats.start}
TOTAL: ${stats.total}
SUCCESS: ${stats.success}
FAIL: ${stats.fail}
SKIPPED: ${stats.pending}
    `
}

function readTestResult() {
    const requireDir = require('require-dir');
    const results = requireDir('../mochawesome-report');
    const stats = {
        total: 0,
        success: 0,
        fail: 0,
        skipped: 0,
        pending: 0
    }
    for (let key in results) {
        const test_stats = results[key].stats;
        stats.start = test_stats.start;
        stats.total += test_stats.tests;
        stats.success += test_stats.passes;
        stats.fail += test_stats.failures;
        stats.skipped += test_stats.skipped;
        stats.pending += test_stats.pending;
    }
    return stats;
}

async function main() {
    const result = readTestResult();

    await publishComment(result, 'app', APP_BRANCH);
    await publishComment(result, 'api', API_BRANCH);
    await publishComment(result, 'andes-test-integracion', TEST_BRANCH);
    await publishComment(result, 'monitoreo-app', MONITOREO_BRANCH);
    await publishComment(result, 'matriculaciones', MATRICULACIONES_BRANCH);

}

main();