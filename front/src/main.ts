import OBR from '@owlbear-rodeo/sdk';
import './style.css'
import viteLogo from '/vite.svg'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
   <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

async function updateLife() {
  const resolved = await fetchCharacterData();
  await OBR.scene.items.updateItems((x) => x.name.startsWith("mao do bobao") && x.layer == "CHARACTER", (list) => {
    for (var item of list) {
      item.text.plainText = "mao do bobao " + resolved;
    }
  });
}

setInterval(updateLife, 10000)

