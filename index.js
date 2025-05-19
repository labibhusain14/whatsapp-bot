const { makeWASocket, useMultiFileAuthState } = require("baileys");
const pino = require("pino");

async function connectToWhatsApp() {
  const authState = await useMultiFileAuthState("session");
  const socket = makeWASocket({
    printQRInTerminal: true,
    browser: ["windows", "chrome", "11"],
    auth: authState.state,
    logger: pino({ level: "debug" }),
  });

  socket.ev.on("creds.update", authState.saveCreds);
  socket.ev.on("connection.update", ({ connection, qr }) => {
    if (connection == "open") {
      console.log("WhatsApp Active...");
    } else if (connection == "close") {
      console.log("WhatsApp Closed...");
      connectToWhatsApp();
    } else if ((connection = "connecting")) {
      console.log("WhatsApp Connecting...");
    }
    if (qr) {
      console.log(qr);
    }
  });

  socket.ev.on("messages.upsert", ({ messages }) => {
    console.log(messages);
    let pesan = "";
    // Deteksi jenis pesan yang masuk
    if (messages[0].message?.conversation) {
      pesan = messages[0].message.conversation;
    } else if (messages[0].message?.extendedTextMessage?.text) {
      pesan = messages[0].message.extendedTextMessage.text;
    } else {
      console.log("Jenis pesan tidak dikenali:", messages[0].message);
      return;
    }

    const phone = messages[0].key.remoteJid;
    if (!messages[0].key.fromMe) {
      query({ question: pesan }).then(async (response) => {
        console.log(response);
        const { text } = response;
        await socket.sendMessage(phone, { text: text });
      });
    }
  });
}

async function query(data) {
  const response = await fetch(
    "https://flowise-1055774796130.asia-southeast2.run.app/api/v1/prediction/0e504744-198c-42d1-a155-5cba2c05851a",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
  const result = await response.json();
  return result;
}

connectToWhatsApp();
