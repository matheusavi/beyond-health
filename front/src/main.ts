import OBR from "@owlbear-rodeo/sdk";
import "./style.css";

const ID = "com.beyondhealth";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
   <input type="text" id="game-id" />  
    <div id="selected-tokens">
    </div>
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
  setupContextMenu();
  setupInitiativeList(document.getElementById("selected-tokens"));
});

function setupInitiativeList(element: any) {
  const renderList = (items: any) => {
    const initiativeItems = [];
    for (const item of items) {
      const metadata = item.metadata[`${ID}/metadata`];
      if (metadata) {
        initiativeItems.push({
          name: item.name,
        });
      }
    }

    const nodes = [];
    for (const initiativeItem of initiativeItems) {
      const node = document.createElement("div");
      const spanNode = document.createElement("span");
      spanNode.innerText = initiativeItem.name;
      node.appendChild(spanNode);

      const selectNode = document.createElement("select");
      selectNode.name = initiativeItem.name;
      warriors.forEach((warrior: any) => {
        const warriorElement = document.createElement("option");
        warriorElement.text = warrior.name;
        warriorElement.value = warrior.hp;
        selectNode.appendChild(warriorElement);
      });
      node.appendChild(selectNode);

      nodes.push(node);
    }
    element.replaceChildren(...nodes);
  };
  OBR.scene.items.onChange(renderList);
}

function setupContextMenu() {
  OBR.contextMenu.create({
    id: `${ID}/context-menu`,
    icons: [
      {
        icon: "/icon.svg",
        label: "Track life",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER" },
            { key: ["metadata", `${ID}/metadata`], value: undefined },
          ],
        },
      },
      {
        icon: "/remove.svg",
        label: "Stop tracking life",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    onClick(context) {
      const addToInitiative = context.items.every(
        (item) => item.metadata[`${ID}/metadata`] === undefined,
      );
      if (addToInitiative) {
        OBR.scene.items.updateItems(context.items, (items) => {
          for (let item of items) {
            console.log(JSON.stringify(item));
            item.metadata[`${ID}/metadata`] = {
              name: item.name, //here insert something to tick as tracking
              // initiative,
            };
          }
        });
      } else {
        OBR.scene.items.updateItems(context.items, (items) => {
          for (let item of items) {
            delete item.metadata[`${ID}/metadata`];
          }
        });
      }
    },
  });
}

async function updateLife() {
  const selector = document.querySelector("select");
  await OBR.scene.items.updateItems(
    (x) => x.name == selector?.name && x.layer == "CHARACTER",
    (list) => {
      for (var item of list) {
        item.text.plainText =
          selector?.selectedOptions[0].text +
          " - " +
          selector?.selectedOptions[0].value;
      }
    },
  );
}

setInterval(updateLife, 10000);

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

let warriors: any[] = [];

window.addEventListener("message", function (event) {
  if (event.data.type === "updateCombatants") {
    warriors = event.data.warriors;
  }
});
