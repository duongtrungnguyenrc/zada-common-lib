import * as protoLoader from "@grpc/proto-loader";
import * as grpc from "@grpc/grpc-js";

export class GrpcClient {
  private static instances: Map<string, GrpcClient> = new Map();

  private protoDescriptor: any;
  private client: any;

  private constructor(
    protoPath: string,
    private packageName: string,
    private serviceName: string,
    private url: string
  ) {
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    this.protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

    const GrpcPackage = this.packageName
      .split(".")
      .reduce((obj, key) => obj?.[key], this.protoDescriptor);

    if (!GrpcPackage)
      throw new Error(`Cannot find package ${this.packageName} in proto`);

    if (!GrpcPackage[this.serviceName])
      throw new Error(
        `Cannot find service ${this.serviceName} in package ${this.packageName}`
      );

    this.client = new GrpcPackage[this.serviceName](
      this.url,
      grpc.credentials.createInsecure()
    );
  }

  static getInstance(
    protoPath: string,
    packageName: string,
    serviceName: string,
    url: string
  ) {
    const key = `${protoPath}|${packageName}|${serviceName}|${url}`;
    if (!GrpcClient.instances.has(key)) {
      GrpcClient.instances.set(
        key,
        new GrpcClient(protoPath, packageName, serviceName, url)
      );
    }
    return GrpcClient.instances.get(key);
  }

  callMethod<Payload = any, Response = any>(
    methodName: string,
    payload: Payload
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.client[methodName](payload, (err: Error, response: Response) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }
}
