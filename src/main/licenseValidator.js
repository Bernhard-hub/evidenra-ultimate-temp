const { net, app } = require('electron');
const path = require('path');
const fs = require('fs');
const HardwareIdGenerator = require('./hardwareId');

class LicenseValidator {
  constructor(productId) {
    this.productId = productId;
    this.userData = app.getPath('userData');
    this.licenseFile = path.join(this.userData, 'license.json');
    this.trialFile = path.join(this.userData, 'trial.json');
    this.MAX_ACTIVATIONS = 1; // 🚨 PRODUCTION: Max 1 computer
  }

  async validateLicense(licenseKey, checkUsage = false) {
    try {
      const formData = new URLSearchParams();
      formData.append('product_id', this.productId);
      formData.append('license_key', licenseKey);
      formData.append('increment_uses_count', checkUsage.toString());

      const response = await this.makeRequest('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (response.success) {
        const licenseData = {
          licenseKey,
          validated: true,
          validatedAt: new Date().toISOString(),
          uses: response.uses,
          purchase: response.purchase
        };
        
        await this.saveLicenseData(licenseData);
        return { valid: true, data: licenseData };
      } else {
        return { valid: false, error: 'Invalid license key' };
      }
    } catch (error) {
      console.error('License validation error:', error);
      return { valid: false, error: error.message };
    }
  }

  async makeRequest(url, options) {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: options.method,
        url: url,
        headers: options.headers
      });

      let responseData = '';

      request.on('response', (response) => {
        response.on('data', (chunk) => {
          responseData += chunk.toString();
        });

        response.on('end', () => {
          try {
            const data = JSON.parse(responseData);
            resolve(data);
          } catch (parseError) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      if (options.body) {
        request.write(options.body);
      }
      
      request.end();
    });
  }

  async saveLicenseData(data) {
    try {
      await fs.promises.writeFile(this.licenseFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving license data:', error);
    }
  }

  async loadLicenseData() {
    try {
      const data = await fs.promises.readFile(this.licenseFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async isLicenseValid() {
    const licenseData = await this.loadLicenseData();
    if (!licenseData || !licenseData.validated) {
      return false;
    }

    // Admin permanent license - never expires, no re-validation needed
    if (licenseData.licenseKey === 'ADMIN-PERMANENT-LICENSE') {
      return true;
    }

    // Check if license was validated within the last 30 days
    const validatedAt = new Date(licenseData.validatedAt);
    const now = new Date();
    const daysDiff = (now - validatedAt) / (1000 * 60 * 60 * 24);

    if (daysDiff > 30) {
      // Re-validate license without incrementing usage count
      const result = await this.validateLicense(licenseData.licenseKey, false);
      return result.valid;
    }

    return true;
  }

  async clearLicenseData() {
    try {
      if (fs.existsSync(this.licenseFile)) {
        await fs.promises.unlink(this.licenseFile);
      }
    } catch (error) {
      console.error('Error clearing license data:', error);
    }
  }

  // 🚨 PRODUCTION: Trial System with Hardware ID Protection
  async initializeTrial() {
    try {
      const trialData = await this.loadTrialData();
      const hardwareId = HardwareIdGenerator.generate();

      if (trialData) {
        // Check if trial exists and hardware ID matches
        if (trialData.hardwareId !== hardwareId) {
          console.warn('⚠️ Trial attempted on different computer - denied');
          return {
            isValid: false,
            daysLeft: 0,
            reason: 'Trial is locked to another computer'
          };
        }

        // Check if trial expired
        const now = Date.now();
        const daysLeft = Math.ceil((trialData.expires - now) / (24 * 60 * 60 * 1000));

        return {
          isValid: now < trialData.expires,
          daysLeft: Math.max(0, daysLeft),
          hardwareId: trialData.hardwareId
        };
      }

      // Create new trial
      const newTrial = {
        hardwareId,
        started: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      };

      await this.saveTrialData(newTrial);

      return {
        isValid: true,
        daysLeft: 30,
        hardwareId
      };
    } catch (error) {
      console.error('Error initializing trial:', error);
      return { isValid: false, daysLeft: 0, reason: error.message };
    }
  }

  async loadTrialData() {
    try {
      const data = await fs.promises.readFile(this.trialFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async saveTrialData(data) {
    try {
      await fs.promises.writeFile(this.trialFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving trial data:', error);
    }
  }

  async checkTrialStatus() {
    // Only check existing trial, don't create new one
    try {
      const trialData = await this.loadTrialData();

      if (!trialData) {
        // No trial exists - return invalid without creating
        return {
          isValid: false,
          daysLeft: 0,
          reason: 'No trial started'
        };
      }

      const hardwareId = HardwareIdGenerator.generate();

      // Check hardware ID matches
      if (trialData.hardwareId !== hardwareId) {
        return {
          isValid: false,
          daysLeft: 0,
          reason: 'Trial is locked to another computer'
        };
      }

      // Check if trial expired
      const now = Date.now();
      const daysLeft = Math.ceil((trialData.expires - now) / (24 * 60 * 60 * 1000));

      return {
        isValid: now < trialData.expires,
        daysLeft: Math.max(0, daysLeft),
        hardwareId: trialData.hardwareId
      };
    } catch (error) {
      console.error('Error checking trial status:', error);
      return { isValid: false, daysLeft: 0, reason: error.message };
    }
  }

  // 🚨 PRODUCTION: Enhanced License Validation with Computer Limit
  async validateLicenseProduction(licenseKey) {
    try {
      // Admin permanent license - instant validation, no Gumroad check
      if (licenseKey === 'ADMIN-PERMANENT-LICENSE') {
        const licenseData = {
          licenseKey,
          hardwareId: 'ADMIN',
          validated: true,
          validatedAt: new Date().toISOString(),
          uses: 0,
          purchase: { email: 'admin@evidenra.com' }
        };
        await this.saveLicenseData(licenseData);
        return {
          valid: true,
          data: licenseData,
          message: 'Admin license activated - permanent access'
        };
      }

      const hardwareId = HardwareIdGenerator.generate();

      // Check existing license data
      const existingLicense = await this.loadLicenseData();
      if (existingLicense && existingLicense.hardwareId) {
        if (existingLicense.hardwareId !== hardwareId) {
          return {
            valid: false,
            error: `License already activated on another computer (max ${this.MAX_ACTIVATIONS} activation)`
          };
        }
      }

      // Validate with Gumroad (increment uses count on first activation)
      const formData = new URLSearchParams();
      formData.append('product_id', this.productId);
      formData.append('license_key', licenseKey);
      formData.append('increment_uses_count', existingLicense ? 'false' : 'true');

      const response = await this.makeRequest('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (response.success) {
        // Check if license exceeded max activations
        if (response.uses > this.MAX_ACTIVATIONS && !existingLicense) {
          return {
            valid: false,
            error: `License exceeded maximum activations (${this.MAX_ACTIVATIONS} computer max)`
          };
        }

        const licenseData = {
          licenseKey,
          hardwareId,
          validated: true,
          validatedAt: new Date().toISOString(),
          uses: response.uses,
          purchase: response.purchase
        };

        await this.saveLicenseData(licenseData);

        return {
          valid: true,
          data: licenseData,
          message: `License activated successfully on this computer`
        };
      } else {
        return {
          valid: false,
          error: 'Invalid license key - please check your Gumroad purchase'
        };
      }
    } catch (error) {
      console.error('License validation error:', error);
      return {
        valid: false,
        error: `Validation failed: ${error.message}`
      };
    }
  }
}

module.exports = LicenseValidator;