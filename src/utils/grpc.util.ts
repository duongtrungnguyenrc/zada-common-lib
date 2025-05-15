import * as protoLoader from "@grpc/proto-loader";
import * as grpc from "@grpc/grpc-js";
import * as path from "path";

export class GrpcClient {
  private static instances: Map<string, GrpcClient> = new Map();

  private protoDescriptor: any;
  private client: any;

  private constructor(
    protoFileName: string,
    private packageName: string,
    private serviceName: string,
    private url: string
  ) {
    const protoPath = path.join(__dirname, "protos", protoFileName);

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
    protoFileName: string,
    packageName: string,
    serviceName: string,
    url: string
  ) {
    const key = `${protoFileName}|${packageName}|${serviceName}|${url}`;
    if (!GrpcClient.instances.has(key)) {
      GrpcClient.instances.set(
        key,
        new GrpcClient(protoFileName, packageName, serviceName, url)
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
