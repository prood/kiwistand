import { env } from "process";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";
import { bootstrap } from "@libp2p/bootstrap";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";

import { appdir } from "./utils.mjs";
import logger from "./logger.mjs";

const { BIND_ADDRESS_V4, PORT } = env;
const DEFAULT_PORT = "53462";
const config = {
  peerId: {},
  transports: [tcp()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  pubsub: gossipsub(),
  protocolPrefix: "p2p",
  addresses: {
    listen: [`/ip4/${BIND_ADDRESS_V4}/tcp/${PORT}`],
  },
};

let IS_BOOTSTRAP_NODE = env.IS_BOOTSTRAP_NODE === "true" ? true : false;
if (IS_BOOTSTRAP_NODE) {
  if (PORT !== DEFAULT_PORT) {
    throw new Error(
      `Bootstrap nodes must run on default port ${DEFAULT_PORT}, current port ${PORT}`
    );
  }
  logger.info("Launching as bootstrap node");
} else {
  logger.info("Configuring bootstrap nodes");
  config.peerDiscovery = [
    bootstrap({
      list: [
        // TODO: We must this allowed to be defined when running config
        `/ip4/127.0.0.1/tcp/${DEFAULT_PORT}/${config.protocolPrefix}/bafzaajiiaijccazrvdlmhms6g7cr6lurqp5aih27agldbplnh77i5oxn74sjm7773q`,
      ],
      timeout: 0,
      tagName: "bootstrap",
    }),
  ];
  config.connectionManager = {
    autoDial: true,
  };
}

let USE_EPHEMERAL_ID = env.USE_EPHEMERAL_ID === "true" ? true : false;
if (USE_EPHEMERAL_ID) {
  logger.info("Using in-memory id.");
} else {
  logger.info("Using id from disk.");
  config.peerId.path = `${appdir()}/.keys.json`;
}

export default config;
