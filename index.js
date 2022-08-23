"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchApp = void 0;
const cactus_core_api_1 = require("@hyperledger/cactus-core-api");
const cactus_core_api_2 = require("@hyperledger/cactus-core-api");
const uuid4_1 = __importDefault(require("uuid4"));
const cactus_cmd_api_server_1 = require("@hyperledger/cactus-cmd-api-server");
const cactus_cmd_api_server_2 = require("@hyperledger/cactus-cmd-api-server");
const cactus_common_1 = require("@hyperledger/cactus-common");
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cactus_plugin_keychain_memory_1 = require("@hyperledger/cactus-plugin-keychain-memory");
const log = cactus_common_1.LoggerProvider.getOrCreate({
    label: "cactus-api",
    level: "INFO",
});
dotenv_1.default.config();
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const configService = new cactus_cmd_api_server_2.ConfigService();
    const apiServerOptions = yield configService.newExampleConfig();
    // If there is no configuration file on the file system, just set it to empty string
    apiServerOptions.configFile = "";
    // Enable CORS for
    apiServerOptions.authorizationProtocol = "NONE";
    apiServerOptions.apiPort = 3000;
    apiServerOptions.cockpitPort = 3100;
    apiServerOptions.grpcPort = 5000;
    apiServerOptions.plugins = [
        //   // hyperledger cactus add plugin keychain-aws-sm
        {
            packageName: "@hyperledger/cactus-plugin-keychain-memory",
            type: cactus_core_api_2.PluginImportType.Remote,
            action: cactus_core_api_1.PluginImportAction.Install,
            options: {
                instanceId: (0, uuid4_1.default)(),
                keychainId: (0, uuid4_1.default)(),
            },
        },
    ];
    // Disble TLS (or provide TLS certs for secure HTTP if you are deploying to production)
    apiServerOptions.apiTlsEnabled = false;
    const config = yield configService.newExampleConfigConvict(apiServerOptions);
    const apiServer = new cactus_cmd_api_server_1.ApiServer({
        config: config.getProperties(),
    });
    // start the API server here and you are ready to roll
    apiServer.start();
});
const app = (0, express_1.default)();
const port = process.env.PORT;
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
const client = () => __awaiter(void 0, void 0, void 0, function* () {
    const apiClient = new cactus_plugin_keychain_memory_1.PluginKeychainMemory({
        instanceId: (0, uuid4_1.default)(),
        keychainId: (0, uuid4_1.default)(),
        logLevel: "INFO",
    });
    // Example: To set a key,value pair
    app.post("/set-kcm", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const key = req.body.key;
        const value = req.body.value;
        try {
            yield apiClient.set(key, value);
            res.status(201).end();
        }
        catch (err) {
            res.status(404).send(err);
        }
    }));
    // get a key value pair
    app.get("/get-kcm/:key", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { key } = req.params;
            const response = yield apiClient.get(key);
            res.end(response);
        }
        catch (err) {
            res.status(404).send(err);
        }
    }));
    // delete key value pair
    app.delete('/delete-kcm/:key', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { key } = req.params;
            yield apiClient.delete(key);
            res.status(200).send("Record deleted successfully");
        }
        catch (err) {
            res.status(404).send(err);
        }
    }));
    // check if key exists
    app.get("/has-key/:key", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { key } = req.params;
            const response = yield apiClient.has(key);
            res.status(200).send(response);
        }
        catch (err) {
            res.status(404).send(err);
        }
    }));
    app.listen(8000, () => {
        console.log(`Example app listening on port ${port}`);
    });
});
function launchApp() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield main();
            yield client();
            log.info(`Cactus API server launched OK `);
        }
        catch (ex) {
            log.error(`Cactus API server crashed: `, ex);
            process.exit(1);
        }
    });
}
exports.launchApp = launchApp;
if (require.main === module) {
    launchApp();
}
