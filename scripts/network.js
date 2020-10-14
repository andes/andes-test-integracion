const https = require('https');
const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        (url.startsWith('https') ? https : http).get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(JSON.parse(data));
            });

        }).on("error", (err) => {
            reject(err);
        });
    })
}

function post(url, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        }, (res) => {
            let data = '';

            // A chunk of data has been recieved.
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve({});
                }
            });
        });
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
        req.on('erro', () => resolve({}));
    });
}

module.exports = { get, post };