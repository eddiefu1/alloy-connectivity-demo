declare module 'alloy-node' {
  interface CRMModule {
    listContacts(): Promise<{ data?: any[] }>;
    getContact(contactId: string): Promise<any>;
    createContact(data: any): Promise<any>;
    updateContact(contactId: string, data: any): Promise<any>;
    listAccounts(): Promise<{ data?: any[] }>;
    getAccount(accountId: string): Promise<any>;
    createAccount(data: any): Promise<any>;
    updateAccount(accountId: string, data: any): Promise<any>;
    setUser(userId: string | null): void;
    connect(connectionId: string | null): void;
    setUrl(url: string): void;
  }

  interface CommerceModule {
    setUser(userId: string | null): void;
    connect(connectionId: string | null): void;
    setUrl(url: string): void;
  }

  interface AccountingModule {
    setUser(userId: string | null): void;
    connect(connectionId: string | null): void;
    setUrl(url: string): void;
  }

  interface WebhooksModule {
    setUser(userId: string | null): void;
    connect(connectionId: string | null): void;
    setUrl(url: string): void;
  }

  interface UserModule {
    // Add user module methods as needed
  }

  export class UAPI {
    constructor(apiKey: string);
    
    // Properties
    headers: Record<string, string>;
    username: string | null;
    userId: string | null;
    connectionId: string | null;
    url: string;
    
    // Modules
    CRM: CRMModule;
    Commerce: CommerceModule;
    Accounting: AccountingModule;
    Webhooks: WebhooksModule;
    User: UserModule;
    
    // Methods
    identify(username: string): Promise<void>;
    connect(connectionId: string): Promise<void>;
    setRegion(region: string): void;
    getDomain(region: string): string;
    clear(): void;
  }

  export class Embedded {
    constructor(options: any);
  }
}
