// 🔌 EVIDENRA Claude Bridge - WebSocket Server
// Ermöglicht Kommunikation zwischen EVIDENRA App und Browser Extensions

const { WebSocketServer } = require('ws');

class ClaudeBridgeServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.port = 18642; // EVIDENRA-spezifischer Port
    this.pendingRequests = new Map();
    this.isRunning = false;
  }

  // Startet den WebSocket Server
  start() {
    if (this.isRunning) {
      console.log('🔌 Claude Bridge Server läuft bereits');
      return;
    }

    try {
      this.wss = new WebSocketServer({ port: this.port });

      this.wss.on('listening', () => {
        console.log(`🚀 Claude Bridge Server gestartet auf Port ${this.port}`);
        this.isRunning = true;
      });

      this.wss.on('connection', (ws, req) => {
        const clientId = this.generateClientId();
        console.log(`📡 Browser Extension verbunden: ${clientId}`);

        this.clients.add(ws);
        ws.clientId = clientId;

        // Verbindungsbestätigung senden
        this.sendToClient(ws, {
          type: 'CONNECTION_ESTABLISHED',
          clientId: clientId,
          timestamp: new Date().toISOString()
        });

        // Message Handler
        ws.on('message', (data) => {
          this.handleMessage(ws, data);
        });

        // Disconnect Handler
        ws.on('close', () => {
          console.log(`🔌 Extension getrennt: ${clientId}`);
          this.clients.delete(ws);
        });

        // Error Handler
        ws.on('error', (error) => {
          console.error(`❌ WebSocket Fehler (${clientId}):`, error.message);
        });
      });

      this.wss.on('error', (error) => {
        console.error('❌ Server Fehler:', error.message);
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${this.port} bereits in Verwendung. Versuche anderen Port...`);
          this.port = this.port + 1;
          setTimeout(() => this.start(), 1000);
        }
      });

    } catch (error) {
      console.error('❌ Konnte Claude Bridge Server nicht starten:', error);
      this.isRunning = false;
    }
  }

  // Stoppt den Server
  stop() {
    if (this.wss) {
      console.log('🛑 Stoppe Claude Bridge Server...');
      this.clients.forEach(client => client.close());
      this.wss.close();
      this.isRunning = false;
    }
  }

  // Verarbeitet eingehende Nachrichten von Extension
  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 Message von Extension (${ws.clientId}):`, message.type);

      switch (message.type) {
        case 'PING':
          this.sendToClient(ws, {
            type: 'PONG',
            timestamp: new Date().toISOString()
          });
          break;

        case 'CLAUDE_RESPONSE':
          // Claude Antwort von Extension empfangen
          this.handleClaudeResponse(message.data, ws);
          break;

        case 'EXTENSION_STATUS':
          // Extension Status Update
          console.log('📊 Extension Status:', message.data);
          break;

        case 'ERROR':
          // Fehler von Extension
          console.error('❌ Extension Fehler:', message.data);
          break;

        default:
          console.warn('⚠️ Unbekannter Message Type:', message.type);
      }
    } catch (error) {
      console.error('❌ Fehler beim Parsen der Message:', error);
    }
  }

  // Sendet Nachricht an spezifischen Client
  sendToClient(ws, message) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast an alle verbundenen Clients
  broadcast(message) {
    const data = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(data);
        sentCount++;
      }
    });

    console.log(`📡 Broadcast an ${sentCount} Extension(s) gesendet`);
    return sentCount;
  }

  // Sendet Report-Generierungsauftrag an Extension
  async generateReport(projectData, reportType) {
    console.log(`📊 Sende Report-Generation an Extension: ${reportType}`);

    if (this.clients.size === 0) {
      throw new Error('Keine Browser Extension verbunden. Bitte installieren und öffnen Sie claude.ai');
    }

    const requestId = this.generateRequestId();
    console.log(`🔑 Generierte Request ID: ${requestId}`);

    const message = {
      type: 'GENERATE_REPORT',
      requestId: requestId,
      data: {
        projectData: projectData,
        reportType: reportType,
        timestamp: new Date().toISOString()
      }
    };

    // Promise für Antwort erstellen
    return new Promise((resolve, reject) => {
      // Timeout nach 15 Minuten (für längere KI-Generierungen wie Dynamic Coding)
      const timeout = setTimeout(() => {
        console.error(`⏱️ Timeout für Request ${requestId} nach 15 Minuten`);
        this.pendingRequests.delete(requestId);
        reject(new Error('Report-Generierung Timeout (15 Minuten)'));
      }, 15 * 60 * 1000);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        timestamp: Date.now()
      });

      console.log(`📝 Pending Request registriert: ${requestId}`);
      console.log(`📊 Aktuell ${this.pendingRequests.size} pending request(s)`);

      // An erste verfügbare Extension senden
      const firstClient = Array.from(this.clients)[0];
      console.log(`📤 Sende an Client: ${firstClient.clientId}`);
      this.sendToClient(firstClient, message);
      console.log(`✅ Message an Extension gesendet`);
    });
  }

  // Verarbeitet Claude Antwort von Extension
  handleClaudeResponse(data, ws) {
    console.log('🔍 handleClaudeResponse aufgerufen');
    console.log('🔍 Empfangene Data Keys:', Object.keys(data));
    console.log('🔍 Data Type:', typeof data);

    const requestId = data.requestId;

    if (!requestId) {
      console.warn('⚠️ Claude Response ohne Request ID erhalten');
      console.warn('⚠️ Vollständige Data:', JSON.stringify(data).substring(0, 500));
      return;
    }

    console.log('🔍 Request ID:', requestId);
    console.log('🔍 Pending Requests:', Array.from(this.pendingRequests.keys()));

    const pendingRequest = this.pendingRequests.get(requestId);

    if (pendingRequest) {
      console.log('✅ Matching Request gefunden');
      console.log('🔍 Response Type:', typeof data.response);
      console.log('🔍 Response Length:', data.response?.length || 0);
      console.log('🔍 Response Preview:', data.response?.substring(0, 200));

      clearTimeout(pendingRequest.timeout);
      pendingRequest.resolve(data.response);
      this.pendingRequests.delete(requestId);
      console.log('✅ Claude Response erfolgreich verarbeitet und Promise resolved');
    } else {
      console.warn('⚠️ Keine passende Request ID gefunden:', requestId);
      console.warn('⚠️ Vorhandene Request IDs:', Array.from(this.pendingRequests.keys()));
    }
  }

  // Generiert eindeutige Client ID
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generiert eindeutige Request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Status-Informationen
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      connectedClients: this.clients.size,
      pendingRequests: this.pendingRequests.size,
      clients: Array.from(this.clients).map(client => ({
        id: client.clientId,
        readyState: client.readyState
      }))
    };
  }

  // Prüft ob Extension verbunden ist
  isConnected() {
    // Nur OPEN connections zählen (readyState === 1)
    let openConnections = 0;
    this.clients.forEach(client => {
      if (client.readyState === 1) {
        openConnections++;
      }
    });

    console.log(`🔍 isConnected() Check: ${openConnections} von ${this.clients.size} Clients sind OPEN`);
    return openConnections > 0;
  }
}

module.exports = ClaudeBridgeServer;
