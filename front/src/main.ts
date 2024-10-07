import OBR from "@owlbear-rodeo/sdk";
import "./style.css";

const ID = "com.beyondhealth";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
   <input type="text" id="game-id" />  
  </div>
`;

OBR.onReady(async () => {
  const metadata = await OBR.room.getMetadata();
  if (metadata && metadata[ID] && (metadata[ID] as any).identifier)
    (document.getElementById("game-id") as HTMLInputElement).value = (
      metadata[ID] as any
    ).identifier;
  else {
    let extensionMetadata: Record<string, any> = {};
    extensionMetadata[ID] = { identifier: getRandomString(256) };
    OBR.room.setMetadata({ ...metadata, ...extensionMetadata });
  }
});

async function updateLife() {
  const metadata = await OBR.room.getMetadata();
  console.log(metadata);
  const resolved = await fetchCharacterData();
  await OBR.scene.items.updateItems(
    (x) => x.name.startsWith("mao do bobao") && x.layer == "CHARACTER",
    (list) => {
      for (var item of list) {
        item.text.plainText = "mao do bobao " + resolved;
      }
    },
  );
}

setInterval(updateLife, 10000);

async function fetchCharacterData() {
  return "Bla";
}

function getRandomString(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const cryptoObj = window.crypto;
  const randomValues = new Uint32Array(length);

  cryptoObj.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }

  return result;
}
