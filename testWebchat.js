const fs = require('fs');
const r = require('./server/services/messageRouter.js');
try {
    const stdMessage = r.createStandardizedMessage('web','uid','hola',{tenantId: 'demo'});
    r.processMessageLocally(stdMessage)
    .then(c => console.log('OK', c))
    .catch(e => {
        fs.writeFileSync('error_dump.txt', String(e.stack));
        console.log('Error caught! Written to error_dump.txt');
    });
} catch (e) {
    fs.writeFileSync('error_dump.txt', String(e.stack));
    console.log('Sync Error caught! Written to error_dump.txt');
}
