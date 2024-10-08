import OBR from "@owlbear-rodeo/sdk";
import "./style.css";

const ID = "com.beyondhealth";

let warriors: any[] = [];

window.addEventListener("message", async function (event) {
  if ((await OBR.player.getRole()) == "GM")
    if (event.data.type === "updateCombatants") {
      warriors = event.data.warriors;
    }
});

OBR.onReady(async () => {
  setupContextMenu();
  setupHealthMapList(document.getElementById("selected-tokens"));
});

function getItemTemplate(tokenName: string, beyondName: string): string {
  return `
        <table
          class="w-full border border-gray-500 bg-white shadow-md rounded-md"
        >
          <tr class="bg-gray-200">
            <td class="px-4 py-2 border-b border-gray-400">${tokenName}</td>
            <td class="px-4 py-2 border-b border-gray-400">${beyondName}</td>
            <td class="px-4 py-2 border-b border-gray-400">
              <button
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Edit
              </button>
            </td>
          </tr>
        </table>
`;
}

function setupHealthMapList(element: any) {
  const renderList = (items: any) => {
    const mappedItems = [];
    for (const item of items) {
      const metadata = item.metadata[`${ID}/metadata`];
      if (metadata) {
        mappedItems.push({
          name: item.name,
          beyondName: metadata.beyondName,
        });
      }
    }

    const nodes = [];
    for (const item of mappedItems) {
      const element = document.createElement("div");
      element.innerHTML = getItemTemplate(item.name, item.beyondName);
      nodes.push(element);
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
          roles: ["GM"],
        },
      },
      {
        icon: "/remove.svg",
        label: "Stop tracking life",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
          roles: ["GM"],
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
            item.metadata[`${ID}/metadata`] = {
              tracking: true,
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
