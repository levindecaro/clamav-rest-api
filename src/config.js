const avConfigTcp = {
  debug_mode: true,
  preference: 'clamdscan',
  clamdscan: {
    host: process.env.CLAMD_IP || '127.0.0.1',
    port: process.env.CLAMD_PORT || 3310,
    timeout: parseInt(process.env.CLAMD_TIMEOUT || 60000),
    socket: null,
    active: true,
  },
};

const avConfigSock = {
  debug_mode: true,
  preference: 'clamdscan',
  clamdscan: {
    host: false,
    port: false,
    timeout: parseInt(process.env.CLAMD_TIMEOUT || 60000),
    socket: '/var/run/clamd.socket',
    active: true,
  },
};


const fuConfig = {
  useTempFiles: false,
  limits: {
    fileSize: parseInt(process.env.APP_MAX_FILE_SIZE),
  },
  limitHandler: (req, res) => {
    res.writeHead(413, {
      Connection: 'close',
      'Content-Type': 'application/json',
    });
    res.end(
      JSON.stringify({
        success: false,
        data: {
          error: `File size limit exceeded. Max size of uploaded file is: ${
            process.env.APP_MAX_FILE_SIZE / 1024
          } KB`,
        },
      })
    );
  },
};

module.exports = {
  avConfigTcp,
  avConfigSock,
  fuConfig,
};
