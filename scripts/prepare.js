const action = process.argv[3];
const type = process.argv[2] || 'develop';

const up = {
    production: [
        'APP=master API=master docker-compose -f docker/docker-compose.yml up -d',
        'sleep 10',
        'docker exec andes_db mongo --eval "rs.initiate();"',
        // 'curl -XPUT "http://localhost:9200/andes/" -d @docker/andes-index.json',
        // 'docker cp docker/andes.gz andes_db:/andes.gz',
        // 'docker exec andes_db mongorestore --gzip --archive=/andes.gz --db andes',
    ],
    develop: [
        'docker-compose -f docker/docker-local.yml up -d',
        'sleep 10',
        'docker exec andes_db mongo --eval "rs.initiate();"',
        // 'mongo andes --eval "db.getCollectionNames().forEach(function(n){db[n].remove()});"',
        // 'curl -XDELETE "http://localhost:9200/andes"',
        // 'curl -XPUT "http://localhost:9200/andes/" -d @docker/andes-index.json',
        // 'mongorestore --gzip --archive=./docker/andes.gz --db andes'
    ]
}

const down = {
    production: [
        'docker-compose -f docker/docker-compose.yml down -v'
    ],
    develop: [
        'docker-compose -f docker/docker-local.yml down -v'
    ]
};

const reset = {
    production: [
        'curl -XDELETE "http://localhost:9266/andes"',
        'curl -XPUT "http://localhost:9266/andes/" -d @docker/andes-index.json',
        'docker exec andes_db mongo andes --eval "db.getCollectionNames().forEach(function(n){db[n].remove({})});"',
        'docker cp docker/andes.gz andes_db:/andes.gz',
        'docker exec andes_db mongorestore --gzip --archive=/andes.gz --db andes',
    ],
    develop: [
        'curl -XDELETE "http://localhost:9266/andes"',
        'curl -XPUT "http://localhost:9266/andes/" -d @docker/andes-index.json',
        'docker exec andes_db mongo andes --eval "db.getCollectionNames().forEach(function(n){db[n].remove({})});"',
        'docker cp docker/andes.gz andes_db:/andes.gz',
        'docker exec andes_db mongorestore --gzip --archive=/andes.gz --db andes',
    ]
};

function runCommands(cmds) {
    const { execSync } = require('child_process');
    for (let i = 0; i < cmds.length; i++) {
        const result = execSync(cmds[i]);
    }
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
}