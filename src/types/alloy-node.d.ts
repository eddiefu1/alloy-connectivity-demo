declare module 'alloy-node' {
  interface AlloyOptions {
    apiKey: string;
  }

  interface UserResponse {
    token?: string;
    userId?: string;
    [key: string]: any;
  }

  interface DataGetParams {
    userId: string;
    integrationId: string;
    entity: string;
  }

  interface DataCreateParams {
    userId: string;
    integrationId: string;
    entity: string;
    data: any;
  }

  interface DataUpdateParams {
    userId: string;
    integrationId: string;
    entity: string;
    recordId: string;
    data: any;
  }

  interface ConnectionParams {
    userId: string;
    integrationId: string;
  }

  interface AlloyClient {
    users: {
      getUser(userId: string): Promise<UserResponse>;
    };
    integrations: {
      list(): Promise<any[]>;
    };
    data: {
      get(params: DataGetParams): Promise<{ data?: any[] }>;
      create(params: DataCreateParams): Promise<any>;
      update(params: DataUpdateParams): Promise<any>;
    };
    connections: {
      get(params: ConnectionParams): Promise<{ status?: string }>;
    };
  }

  class Alloy {
    constructor(options: AlloyOptions);
    users: AlloyClient['users'];
    integrations: AlloyClient['integrations'];
    data: AlloyClient['data'];
    connections: AlloyClient['connections'];
  }

  export default Alloy;
}
