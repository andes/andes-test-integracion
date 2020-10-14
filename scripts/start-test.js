
const { sendMessage } = require('./slack');
const { getBuildNumber } = require('./cypress');
const USERNAME = process.env.USERNAME;


getBuildNumber().then((number) => {
    const texto = `Tus test estan arrancando https://dashboard.cypress.io/projects/xr7gft/runs/${number + 1}/specs :muscle: :muscle:`
    return sendMessage(USERNAME, texto);
});