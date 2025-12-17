// src/main/trialManager.js
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TrialManager {
  constructor() {
    // Persistent storage path (funktioniert auch für Portable EXE!)
    const userDataPath = app.getPath('userData');
    this.trialFilePath = path.join(userDataPath, '.evd-trial');

    // Hardware-basierte Machine ID für zusätzliche Sicherheit
    this.machineId = this.getMachineId();

    console.log('TrialManager initialized:', {
      trialFilePath: this.trialFilePath,
      machineId: this.machineId.substring(0, 8) + '...' // Log nur Anfang
    });
  }

  /**
   * Generiert eine eindeutige Machine ID basierend auf Hardware
   */
  getMachineId() {
    try {
      const { machineIdSync } = require('node-machine-id');
      return machineIdSync();
    } catch (error) {
      console.warn('node-machine-id nicht verfügbar, verwende Fallback');

      // Fallback: Kombiniere mehrere System-Identifikatoren
      const os = require('os');
      const identifier = [
        os.hostname(),
        os.platform(),
        os.arch(),
        os.cpus()[0].model
      ].join('-');

      return crypto.createHash('sha256').update(identifier).digest('hex');
    }
  }

  /**
   * Prüft den Trial-Status
   */
  checkTrial() {
    try {
      // Prüfe ob Trial-Datei existiert
      if (!fs.existsSync(this.trialFilePath)) {
        console.log('Keine Trial-Datei gefunden, starte neuen Trial');
        return this.startNewTrial();
      }

      // Lese Trial-Daten
      const fileContent = fs.readFileSync(this.trialFilePath, 'utf8');
      const data = JSON.parse(fileContent);

      // Verifiziere Integrität (verhindert manuelle Änderungen)
      if (!this.verifySignature(data)) {
        console.warn('⚠️ Trial-Daten wurden manipuliert! Setze zurück...');
        fs.unlinkSync(this.trialFilePath);
        return this.startNewTrial();
      }

      // Prüfe ob Machine ID übereinstimmt (verhindert Kopieren)
      if (data.machineId !== this.machineId) {
        console.warn('⚠️ Trial wurde auf anderes Gerät kopiert! Setze zurück...');
        fs.unlinkSync(this.trialFilePath);
        return this.startNewTrial();
      }

      // Berechne verbleibende Tage
      const startDate = data.startDate;
      const now = Date.now();
      const daysPassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, 30 - daysPassed);

      console.log('Trial Status:', {
        startDate: new Date(startDate).toLocaleDateString(),
        daysPassed,
        daysLeft,
        isValid: daysLeft > 0
      });

      return {
        isValid: daysLeft > 0,
        daysLeft,
        startDate,
        daysPassed
      };

    } catch (error) {
      console.error('❌ Fehler beim Trial-Check:', error);
      // Bei Fehler: Neuen Trial starten (besser als App zu blockieren)
      return this.startNewTrial();
    }
  }

  /**
   * Startet einen neuen 30-Tage Trial
   */
  startNewTrial() {
    const startDate = Date.now();
    const data = {
      startDate,
      machineId: this.machineId,
      version: app.getVersion(),
      created: new Date().toISOString()
    };

    // Signiere Daten um Manipulation zu verhindern
    const signature = this.signData(data);
    const signedData = { ...data, signature };

    // Speichere Trial-Datei
    try {
      // Stelle sicher, dass userData Verzeichnis existiert
      const userDataPath = path.dirname(this.trialFilePath);
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      fs.writeFileSync(this.trialFilePath, JSON.stringify(signedData, null, 2), 'utf8');
      console.log('✅ Neuer Trial gestartet:', new Date(startDate).toLocaleDateString());

      return {
        isValid: true,
        daysLeft: 30,
        startDate,
        daysPassed: 0
      };
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Trial-Datei:', error);
      // Fallback: Trial im Memory (funktioniert nur bis App-Neustart)
      return {
        isValid: true,
        daysLeft: 30,
        startDate,
        daysPassed: 0,
        warning: 'Trial konnte nicht gespeichert werden'
      };
    }
  }

  /**
   * Signiert Daten mit HMAC-SHA256
   */
  signData(data) {
    // Secret basiert auf Machine ID (eindeutig pro Gerät)
    const secret = `evidenra-${this.machineId}-${app.getVersion()}`;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(data));

    return hmac.digest('hex');
  }

  /**
   * Verifiziert die Signatur der Trial-Daten
   */
  verifySignature(data) {
    if (!data.signature) {
      return false;
    }

    const { signature, ...dataWithoutSig } = data;
    const expectedSignature = this.signData(dataWithoutSig);

    return signature === expectedSignature;
  }

  /**
   * Setzt den Trial zurück (nur für Entwicklung/Testing!)
   */
  resetTrial() {
    try {
      if (fs.existsSync(this.trialFilePath)) {
        fs.unlinkSync(this.trialFilePath);
        console.log('✅ Trial wurde zurückgesetzt');
        return { success: true, message: 'Trial reset erfolgreich' };
      }
      return { success: true, message: 'Keine Trial-Datei gefunden' };
    } catch (error) {
      console.error('❌ Fehler beim Trial-Reset:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Aktiviert eine Lizenz
   */
  activateLicense(licenseKey) {
    // TODO: Implementiere Lizenz-Validierung
    // Für jetzt: Einfache Struktur vorbereiten

    const licenseData = {
      key: licenseKey,
      activatedAt: Date.now(),
      machineId: this.machineId,
      version: app.getVersion()
    };

    const signature = this.signData(licenseData);
    const signedLicense = { ...licenseData, signature };

    try {
      const licensePath = path.join(path.dirname(this.trialFilePath), '.evd-license');
      fs.writeFileSync(licensePath, JSON.stringify(signedLicense, null, 2), 'utf8');

      console.log('✅ Lizenz aktiviert');
      return { success: true, license: signedLicense };
    } catch (error) {
      console.error('❌ Fehler bei Lizenz-Aktivierung:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Prüft ob eine gültige Lizenz existiert
   */
  checkLicense() {
    try {
      const licensePath = path.join(path.dirname(this.trialFilePath), '.evd-license');

      if (!fs.existsSync(licensePath)) {
        return { isValid: false, type: 'trial' };
      }

      const data = JSON.parse(fs.readFileSync(licensePath, 'utf8'));

      // Verifiziere Signatur
      if (!this.verifySignature(data)) {
        console.warn('⚠️ Lizenz-Daten wurden manipuliert!');
        return { isValid: false, type: 'trial' };
      }

      // Prüfe Machine ID
      if (data.machineId !== this.machineId) {
        console.warn('⚠️ Lizenz gehört zu anderem Gerät!');
        return { isValid: false, type: 'trial' };
      }

      return {
        isValid: true,
        type: 'licensed',
        activatedAt: data.activatedAt,
        key: data.key.substring(0, 8) + '...' // Zeige nur Anfang
      };
    } catch (error) {
      console.error('❌ Fehler beim Lizenz-Check:', error);
      return { isValid: false, type: 'trial' };
    }
  }

  /**
   * Gibt vollständigen Status zurück (Lizenz oder Trial)
   */
  getStatus() {
    // Zuerst Lizenz prüfen
    const licenseStatus = this.checkLicense();
    if (licenseStatus.isValid) {
      return {
        type: 'licensed',
        isValid: true,
        ...licenseStatus
      };
    }

    // Wenn keine Lizenz, prüfe Trial
    const trialStatus = this.checkTrial();
    return {
      type: 'trial',
      ...trialStatus
    };
  }
}

// Singleton Export
module.exports = new TrialManager();
