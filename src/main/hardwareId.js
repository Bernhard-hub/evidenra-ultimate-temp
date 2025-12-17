/**
 * Hardware ID Generator
 * Generates unique machine identifier to prevent trial abuse
 */

const crypto = require('crypto');
const os = require('os');

class HardwareIdGenerator {
  static generate() {
    const platform = os.platform();
    const hostname = os.hostname();
    const cpus = os.cpus();
    const totalmem = os.totalmem();

    // Create a fingerprint from system info
    const fingerprint = `${platform}-${hostname}-${cpus.length}-${cpus[0]?.model || ''}-${totalmem}`;

    // Generate a SHA256 hash
    const hash = crypto.createHash('sha256');
    hash.update(fingerprint);

    return hash.digest('hex').substring(0, 32).toUpperCase();
  }

  static validate(storedId) {
    const currentId = this.generate();
    return currentId === storedId;
  }
}

module.exports = HardwareIdGenerator;
