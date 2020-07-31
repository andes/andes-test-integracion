const action = process.argv[3];
const type = process.argv[2] || 'develop';

const up = {
    production: [
        'npm run prod:down',
        'npx cross-env APP=master API=master docker-compose -f docker/docker-compose-prod-local.yml up -d',
    ],
    develop: [
        'docker-compose -f docker/docker-local.yml up -d',
    ]
}

const down = {
    production: [
        'docker-compose -f docker/docker-compose-prod-local.yml down -v'
    ],
    develop: [
        'docker-compose -f docker/docker-local.yml down -v'
    ]
};

const reset = {
    production: [
        'node scripts/seeder.js'
    ],
    develop: [
        'node scripts/seeder.js'
    ]
};

const backup = {
    production: [
        'docker exec andes_test_db mongodump --gzip --archive=/andes.gz --db andes',
        'docker cp andes_test_db:/andes.gz docker/andes.gz'
    ]
};

function runCommands(cmds) {
    const { execSync } = require('child_process');
    for (let i = 0; i < cmds.length; i++) {
        console.log('-> ', cmds[i]);
        const result = execSync(cmds[i]);
    }
}

function sleep() {
    setTimeout(() => { }, 10000);
}
switch (action) {
    case 'up':
        runCommands(up[type]);
        break;
    case 'down':
        runCommands(down[type]);
        break;
    case 'reset':
        runCommands(reset[type]);
        break;
    case 'backup':
        runCommands(backup[type]);
        break;
    case 'sleep':
        sleep();
        break;
}