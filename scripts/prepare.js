const action = process.argv[2];
const type = process.argv[3] || 'local';

const up = {
    docker: [
        'docker-compose -f docker/docker-local.yml up -d',
        'sleep 10',
        'curl -XPUT "http://localhost:9200/andes/" -d @docker/andes-index.json',
        'docker exec andes_db mongo --eval "rs.initiate();"',
        'docker cp docker/andes.gz andes_db:/andes.gz',
        'docker exec andes_db mongorestore --gzip --archive=/andes.gz --db andes',
    ],
    local: [
        'mongo andes --eval "db.getCollectionNames().forEach(function(n){db[n].remove()});"',
        'curl -XDELETE "http://localhost:9200/andes"',
        'curl -XPUT "http://localhost:9200/andes/" -d @docker/andes-index.json',
        'mongorestore --gzip --archive=./docker/andes.gz --db andes'
    ]
}

const down = {
    docker: [
        'docker-compose -f docker/docker-local.yml down -v'
    ],
    local: []
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
}