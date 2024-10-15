import OBR from "@owlbear-rodeo/sdk";
import "./style.css";
import { ID } from "./constants";
import { Warrior } from "./warrior";
import { sanitizeWarriors } from "./util";

window.addEventListener("message", async function (event) {
  if ((await OBR.player.getRole()) == "GM")
    if (event.data.type === "updateCombatants") {
      addCombatantsToMetadata(event.data.warriors);
    }
});

function addCombatantsToMetadata(warriors: Warrior[]) {
  OBR.room.getMetadata().then((roomMetadata) => {
    roomMetadata[`${ID}/warriors`] = sanitizeWarriors(warriors);
    OBR.room.setMetadata(roomMetadata);
    for (let item of warriors) {
      updateTokenHp(item.name, item.hp + "/" + item.maxHp);
    }
  });
}

OBR.onReady(() => {
  setupContextMenu();
  setupHealthMapList();
});

async function getWarriors(): Promise<Warrior[]> {
  const metadata = await OBR.room.getMetadata();
  return metadata[`${ID}/warriors`] as Warrior[];
}

function updateTokenHp(beyondName: string, hp: string) {
  OBR.scene.items.updateItems(
    (x) => !!x.metadata[`${ID}/metadata`],
    (items) => {
      for (let item of items) {
        let metadata = item.metadata[`${ID}/metadata`];
        if (!metadata) return;
        if (metadata && metadata.beyondName == beyondName) {
          item.metadata[`${ID}/metadata`] = {
            ...item.metadata[`${ID}/metadata`],
            hp: hp,
          };
          item.text.plainText = `${beyondName} - ${hp}`;
        }
      }
    },
  );
}

function getItemTemplate(tokenName: string, beyondName: string): string {
  return `
          <tr class="text-white">
            <td class="px-4 py-2 border-b border-gray-400">${tokenName.substring(0, 15)}</td>
            <td class="px-4 py-2 border-b border-gray-400">${beyondName}</td>
            <td class="px-4 py-2 border-b border-gray-400">
              <button
                class="bg-violet-500 text-white px-4 py-2 rounded hover:bg-violet-300"
                data-type="token-editor"
                data-token="${tokenName}"
              >
                Edit
              </button>
            </td>
          </tr>
`;
}

function getChampionsTemplate(warriors: Warrior[], tokenName: string): string {
  let warriorsHtml = "";
  warriors.forEach((warrior) => {
    warriorsHtml += `
        <label class="cursor-pointer">
          <input type="radio" name="warrior" value="${warrior.name}" class="hidden peer" />
          <div
            class="border rounded-lg px-4 py-2 text-center peer-checked:bg-violet-300 peer-checked:text-white"
          >
             ${warrior.name}
          </div>
        </label>
      `;
  });
  return `
    <tr class="text-white" id="token-editor">
      <td colspan="3">
        <div class="flex items-center mb-4">
          <div class="grid grid-cols-2 gap-4">
            ${warriorsHtml}
          <button
            class="border rounded-lg px-4 py-2 text-center bg-violet-500 peer-checked:text-white"
            data-type="token-save"
            data-token="${tokenName}"
          >
            Save
          </button>
          <button
            class="border rounded-lg px-4 py-2 text-center bg-violet-500 peer-checked:text-white"
            data-type="token-cancel"
          >
            Cancel
          </button>
          </div>
        </div>
      </td>
    </tr>
`;
}

function removeOpenEditors() {
  document.querySelector("#token-editor")?.remove();
}

function setTokenCancelButtons() {
  document
    .querySelector("button[data-type='token-cancel']")!
    .addEventListener("click", (e: any) => {
      removeOpenEditors();
    });
}

function setTokenSaveButtons() {
  document
    .querySelector("button[data-type='token-save']")!
    .addEventListener("click", (e: any) => {
      const token = e.target.getAttribute("data-token");
      const warrior = (
        document.querySelector(
          "input[name='warrior']:checked",
        ) as HTMLInputElement
      ).value;
      OBR.scene.items.updateItems(
        (x) => x.name == token,
        (items) => {
          for (let item of items) {
            item.metadata[`${ID}/metadata`] = {
              ...item.metadata[`${ID}/metadata`],
              beyondName: warrior,
            };
          }
        },
      );
      removeOpenEditors();
    });
}

async function setupHealthMapList() {
  const renderList = async (items: any) => {
    const mappedItems = new Map();
    for (const item of items) {
      const metadata = item.metadata[`${ID}/metadata`];
      if (metadata) {
        mappedItems.set(item.name, metadata.beyondName);
      }
    }

    const element = document.querySelector("#selected-tokens");
    let html = "";
    for (const [key, value] of mappedItems) {
      html += getItemTemplate(key, value);
    }

    element!.innerHTML = html;
    let buttons = document.querySelectorAll("button[data-type='token-editor']");
    buttons.forEach((b) => {
      b.addEventListener("click", async (e: any) => {
        const token = e.target.getAttribute("data-token");
        const warriors = await getWarriors();
        b.parentElement!.parentElement!.insertAdjacentHTML(
          "afterend",
          getChampionsTemplate(warriors, token),
        );
        setTokenSaveButtons();
        setTokenCancelButtons();
      });
    });
  };
  OBR.scene.items.onChange(renderList);
  setTimeout(async () => renderList(await OBR.scene.items.getItems()), 2000);
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
