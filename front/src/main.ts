import OBR from "@owlbear-rodeo/sdk";
import "./style.css";

const ID = "com.beyondhealth";

window.addEventListener("message", async function (event) {
  if ((await OBR.player.getRole()) == "GM")
    if (event.data.type === "updateCombatants") {
      addCombatantsToMetadata(event.data.warriors);
    }
});

function addCombatantsToMetadata(warriors: any[]) {
  OBR.room.getMetadata().then((roomMetadata) => {
    roomMetadata[`${ID}/warriors`] = warriors;
    OBR.room.setMetadata(roomMetadata);
  });
}

OBR.onReady(() => {
  setupContextMenu();
  setupHealthMapList(document.getElementById("selected-tokens"));
});

async function getWarriors() {
  const metadata = await OBR.room.getMetadata();
  return metadata[`${ID}/warriors`];
}

function getItemTemplate(tokenName: string, beyondName: string): string {
  return `
          <tr class="bg-gray-200 border-spacing-2 border border-slate-500">
            <td class="px-4 py-2 border">${tokenName}</td>
            <td class="px-4 py-2">${beyondName}</td>
            <td class="px-4 py-2">
              <button
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                data-type="token-editor"
                data-id="${ID}"
                data-token="${tokenName}"
              >
                Edit
              </button>
            </td>
          </tr>
`;
}

async function setupHealthMapList(element: any) {
  const renderList = async (items: any) => {
    const mappedItems = new Map();
    for (const item of items) {
      const metadata = item.metadata[`${ID}/metadata`];
      if (metadata) {
        mappedItems.set(item.name, metadata.beyondName);
      }
    }

    const nodes = [];
    for (const [key, value] of mappedItems) {
      const element = document.createElement("div");
      element.innerHTML = getItemTemplate(key, value);
      nodes.push(element);
    }
    element.replaceChildren(...nodes);
    let buttons = document.querySelectorAll("button[data-type='token-editor']");
    buttons.forEach((b) => {
      b.addEventListener("click", (e) => {
        alert(e);
      });
    });
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

// async function updateLife() {
//   const selector = document.querySelector("select");
//   await OBR.scene.items.updateItems(
//     (x) => x.name == selector?.name && x.layer == "CHARACTER",
//     (list) => {
//       for (var item of list) {
//         item.text.plainText =
//           selector?.selectedOptions[0].text +
//           " - " +
//           selector?.selectedOptions[0].value;
//       }
//     },
//   );
// }
//
// setInterval(updateLife, 10000);
