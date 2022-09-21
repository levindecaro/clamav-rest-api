const NodeClam = require('clamscan');
const https = require('https'),
  fs = require('fs');
  helmet = require('helmet');
const { constants } = require('crypto');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
// const bodyParser = require('body-parser');

const versionRouter = require('./routes/version');
const scanRouter = require('./routes/scan');
const auth = require('./auth');

const UnixSocketMode = process.env.UNIX_SOCKET_MODE || false;
const certPath = process.env.CERT_PATH || '/opt/clamav-rest-api/private/cert.pem';
const keyPath = process.env.KEY_PATH || '/opt/clamav-rest-api/private/key.pem';

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
  secureOptions:  constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_NO_SSLv3  |constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
}


async function makeServer(cfg) {
  try {
    const newAvConfig = UnixSocketMode
      ? Object.assign({}, cfg.avConfigSock)
      : Object.assign({}, cfg.avConfigTcp);
    const clamscan = await new NodeClam().init(newAvConfig);
    const server_timeout = process.env.SRV_TIMEOUT || 60000;
    const PORT = process.env.APP_PORT || 3000;
    const app = express();

    app.use(auth);
    app.use(cors());
    // app.use(bodyParser.json());
    // app.use(bodyParser.urlencoded({ extended: true }));
    app.use((req, res, next) => {
      req.setTimeout(parseInt(server_timeout));
      req._av = clamscan;
      next();
    });

    app.use(fileUpload({ ...cfg.fuConfig }));
    process.env.NODE_ENV !== 'test' &&
      app.use(morgan(process.env.APP_MORGAN_LOG_FORMAT || 'combined'));
    app.use('/api/v1/version', versionRouter);
    app.use('/api/v1/scan', scanRouter);
    app.all('*', (req, res, next) => {
      res.status(405).json({ success: false, data: { error: 'Not allowed.' } });
    });

    const srv = https.createServer(options,app).listen(PORT, () => {
      process.env.NODE_ENV !== 'test' &&
        console.log(`Server started on PORT: ${PORT}`);
    });
    return srv;
  } catch (error) {
    console.log(`Cannot initialize clamav object: ${error}`);
  }
}

module.exports = { makeServer };
