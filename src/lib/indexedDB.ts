// IndexedDB wrapper for offline-first client storage
export interface DBClient {
  id: string;
  name: string;
  email: string;
  businessName: string;
  phone?: string;
  gstin?: string;
  city?: string;
  state?: string;
  country?: string;
  billingAddress: string;
  createdAt: string;
  updatedAt: string;
}

class IndexedDBManager {
  private dbName = 'InvoicceDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('❌ IndexedDB failed to open');
        reject(new Error('Failed to open local database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create clients store
        if (!db.objectStoreNames.contains('clients')) {
          const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
          clientStore.createIndex('email', 'email', { unique: true });
          clientStore.createIndex('name', 'name', { unique: false });
          console.log('✅ Created clients store');
        }
      };
    });
  }

  async addClient(client: Omit<DBClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBClient> {
    if (!this.db) await this.init();

    const newClient: DBClient = {
      ...client,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clients'], 'readwrite');
      const store = transaction.objectStore('clients');
      const request = store.add(newClient);

      request.onsuccess = () => {
        console.log('✅ Client added to IndexedDB:', newClient.name);
        resolve(newClient);
      };

      request.onerror = () => {
        console.error('❌ Failed to add client to IndexedDB');
        if (request.error?.name === 'ConstraintError') {
          reject(new Error('A client with this email already exists'));
        } else {
          reject(new Error('Failed to save client'));
        }
      };
    });
  }

  async getClients(): Promise<DBClient[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clients'], 'readonly');
      const store = transaction.objectStore('clients');
      const request = store.getAll();

      request.onsuccess = () => {
        const clients = request.result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        console.log(`✅ Retrieved ${clients.length} clients from IndexedDB`);
        resolve(clients);
      };

      request.onerror = () => {
        console.error('❌ Failed to get clients from IndexedDB');
        reject(new Error('Failed to retrieve clients'));
      };
    });
  }

  async updateClient(id: string, updates: Partial<DBClient>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clients'], 'readwrite');
      const store = transaction.objectStore('clients');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const client = getRequest.result;
        if (!client) {
          reject(new Error('Client not found'));
          return;
        }

        const updatedClient = {
          ...client,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        const putRequest = store.put(updatedClient);
        putRequest.onsuccess = () => {
          console.log('✅ Client updated in IndexedDB:', updatedClient.name);
          resolve();
        };
        putRequest.onerror = () => {
          console.error('❌ Failed to update client in IndexedDB');
          reject(new Error('Failed to update client'));
        };
      };

      getRequest.onerror = () => {
        console.error('❌ Failed to find client in IndexedDB');
        reject(new Error('Failed to find client'));
      };
    });
  }

  async deleteClient(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clients'], 'readwrite');
      const store = transaction.objectStore('clients');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('✅ Client deleted from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ Failed to delete client from IndexedDB');
        reject(new Error('Failed to delete client'));
      };
    });
  }
}

export const indexedDBManager = new IndexedDBManager();