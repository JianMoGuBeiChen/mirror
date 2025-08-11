const { exec } = require('child_process');
const os = require('os');

// Get the local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '0.0.0.0';
}

const localIP = getLocalIP();
console.log(`Starting server on ${localIP}:8888`);

// Set environment variables and start
process.env.HOST = localIP;
process.env.PORT = '8888';

exec('npm start', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});
