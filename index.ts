import { PluginImportAction } from "@hyperledger/cactus-core-api";
import { PluginImportType } from "@hyperledger/cactus-core-api";
import uuid4 from "uuid4";
import { ApiServer } from "@hyperledger/cactus-cmd-api-server";
import { ConfigService } from "@hyperledger/cactus-cmd-api-server";
import { Logger, LoggerProvider } from "@hyperledger/cactus-common";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import cors from 'cors'

const log: Logger = LoggerProvider.getOrCreate({
  label: "cactus-api",
  level: "INFO",
});
dotenv.config();

const main = async () => {
  const configService = new ConfigService();
  const apiServerOptions: any = await configService.newExampleConfig();
  // If there is no configuration file on the file system, just set it to empty string
  apiServerOptions.configFile = "";
  // Enable CORS for
  apiServerOptions.authorizationProtocol = "NONE";
  apiServerOptions.apiPort = 3001;
  apiServerOptions.cockpitPort = 3100;
  apiServerOptions.grpcPort = 5000;
  apiServerOptions.plugins = [
    //   // hyperledger cactus add plugin keychain-aws-sm
    {
      packageName: "@hyperledger/cactus-plugin-keychain-memory",
      type: PluginImportType.Remote,
      action: PluginImportAction.Install,
      options: {
        instanceId: uuid4(),
        keychainId: uuid4(),
      },
    },

  ];
  // Disble TLS (or provide TLS certs for secure HTTP if you are deploying to production)
  apiServerOptions.apiTlsEnabled = false;

  const config = await configService.newExampleConfigConvict(apiServerOptions);


  const apiServer = new ApiServer({
    config: config.getProperties(),
  });
  // start the API server here and you are ready to roll
  apiServer.start();
};

const app = express();
app.use(cors())
const port = process.env.PORT;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const client = async () => {


  const apiClient = new PluginKeychainMemory({
    instanceId: uuid4(),
    keychainId: uuid4(),
    logLevel: "INFO",
  });

  // Example: To set a key,value pair
  app.post("/set-kcm", async (req: Request, res: Response) => {
    const key = req.body.key;
    const value = req.body.value;
    try {
      await apiClient.set(key, value);
      res.status(201).end();
    } catch (err: any) {
      res.status(404).send(err);
    }
  });
  // get a key value pair
  app.get("/get-kcm/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const response = await apiClient.get(key);
      res.end(response);
    } catch (err: any) {
      res.status(404).send(err);
    }
  });
  // delete key value pair
  app.delete('/delete-kcm/:key',async (req:Request,res:Response)=>{
    try{
      const {key} = req.params;
      await apiClient.delete(key);
      res.status(200).end();
    }catch(err:any){
      res.status(404).send(err);
    }
  })

  // check if key exists
  app.get("/has-key/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const response = await apiClient.has(key);
      res.status(200).send(response);
    }
    catch(err:any){
      res.status(404).send(err);
    }
  });

  app.get("/", (req: Request, res: Response) => {
    log.info("Cactus: Hello World");
    res.send("Hello World - Server!");
  });
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

export async function launchApp(): Promise<void> {
  try {
    await main();
    await client()
    log.info(`Cactus API server launched OK `);
  } catch (ex) {
    log.error(`Cactus API server crashed: `, ex);
    process.exit(1);
  }
}

if (require.main === module) {
  launchApp();
}
