const fs = require("fs");
const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/rest");

// const PRIVATE_KEY = fs.readFileSync(process.env.GITHUB_PRIVATE_KEY, 'utf8');
// const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
// const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
// const APP_ID = process.env.GITHUB_APP_ID;
// const INSTALATION_ID = process.env.GITHUB_INSTALATION_ID;

const PERSONAL_TOKEN = process.env.GITHUB_PERSONAL_TOKEN;

const APP_BRANCH = process.env.APP_BRANCH || "master";
const API_BRANCH = process.env.API_BRANCH || "master";
const MATRICULACIONES_BRANCH = process.env.MATRICULACIONES_BRANCH || "master";
const MONITOREO_BRANCH = process.env.MONITOREO_BRANCH || "master";
const TEST_BRANCH = process.env.TEST_BRANCH || "master";

const BUILD_ID =
  parseInt(process.env.BUILD_NUMBER, 10) || Math.round(Math.random() * 100);

async function publishComment(result, repo, branch) {
  if (branch === "master") return;
  const octokit = new Octokit({
    auth: PERSONAL_TOKEN
  });

  const prs = await octokit.pulls.list({
    owner: "andes",
    repo: repo,
    state: "open",
    head: `andes/${repo}:${branch}`
  });

  if (prs.data.length > 0) {
    const pr = prs.data[0];
    await octokit.request(
      "POST /repos/:owner/:repo/issues/:issue_number/comments",
      {
        owner: "andes",
        repo: repo,
        issue_number: pr.number,
        body: createStatsText(result)
      }
    );
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
    `;
}

function readTestResult() {
  const requireDir = require("require-dir");
  const results = requireDir("../mochawesome-report");
  const stats = {
    total: 0,
    success: 0,
    fail: 0,
    skipped: 0,
    pending: 0
  };
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

  await publishComment(result, "app", APP_BRANCH);
  await publishComment(result, "api", API_BRANCH);
  await publishComment(result, "andes-test-integracion", TEST_BRANCH);
  await publishComment(result, "monitoreo-app", MONITOREO_BRANCH);
  await publishComment(result, "matriculaciones", MATRICULACIONES_BRANCH);
}

main();
