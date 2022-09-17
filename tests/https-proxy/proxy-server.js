
// https://github.com/strapi/strapi/issues/4884 ??
// openssl req -nodes -new -x509 -keyout server.key -out server.cert
// openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem

let httpProxy = require('http-proxy');
let fs = require('fs');

httpProxy.createServer({
  target: {
    host: 'localhost',
    port: process.env.TARGET_PORT,
  },
  ssl: {
    key: fs.readFileSync(__dirname + '/key.pem', 'utf8'),
    cert: fs.readFileSync(__dirname + '/cert.pem', 'utf8')
  }
}).listen(process.env.HTTPS_PORT);

