const https = require('https');
const http = require('http');

const { sendMessage } = require('./slack');
const { post } = require('./network');

async function getBuildNumber() {
    return post(
        "https://dashboard.cypress.io/graphql",
        "{\"operationName\":\"RunsList\",\"variables\":{\"projectId\":\"xr7gft\",\"input\":{\"page\":1,\"timeRange\":{\"startDate\":\"1970-01-01\",\"endDate\":\"2038-01-19\"},\"perPage\":30}},\"query\":\"query RunsList($projectId: String!, $input: ProjectRunsConnectionInput) {\\n  project(id: $projectId) {\\n    id\\n    name\\n    isUsingRetries\\n    organizationInfo {\\n      id\\n      name\\n      projects {\\n        totalCount\\n        __typename\\n      }\\n      __typename\\n    }\\n    runs(input: $input) {\\n      totalCount\\n      nodes {\\n        id\\n        ...RunsListItem\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment RunsListItem on Run {\\n  id\\n  status\\n  buildNumber\\n  totalPassed\\n  totalFailed\\n  totalPending\\n  totalSkipped\\n  startTime\\n  totalDuration\\n  scheduledToCompleteAt\\n  parallelizationDisabled\\n  cancelledAt\\n  totalFlakyTests\\n  project {\\n    id\\n    __typename\\n  }\\n  ci {\\n    provider\\n    ciBuildNumberFormatted\\n    __typename\\n  }\\n  commit {\\n    branch\\n    message\\n    summary\\n    authorAvatar\\n    authorName\\n    authorEmail\\n    __typename\\n  }\\n  tags {\\n    id\\n    name\\n    color\\n    __typename\\n  }\\n  __typename\\n}\\n\"}"
    ).then((resp) => {
        return resp.data.project.runs.nodes[0].buildNumber;
    });
}

module.exports = {
    getBuildNumber
}