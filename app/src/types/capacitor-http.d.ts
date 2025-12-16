declare module '@capacitor/http' {
  export interface HttpOptions {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    params?: any;
    data?: any;
  }

  export interface HttpResponse {
    data: any;
    status: number;
    headers?: Record<string, string>;
  }

  export const Http: {
    request: (options: HttpOptions) => Promise<HttpResponse>;
  };

  export default { Http };
}

// also allow importing the package as a namespace/any to be safe
declare module '@capacitor/http/*';
