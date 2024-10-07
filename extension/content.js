function handleDnDBeyond() {
  function getWarriors() {
    let warriors = document.querySelectorAll('.combatant-card');
    let result = [];
    warriors.forEach(x => result.push({
      name: x.querySelector('.combatant-summary__name')?.innerText,
      hp: x.querySelector('.combatant-card__hp-current')?.innerText
    }));

    chrome.storage.local.set({ 'dndbeyond-warriors': result }, () => {
      console.log('Warriors data saved to chrome storage');
    });
  }
  setInterval(getWarriors, 10000);
}

function handleOwlbearRodeo() {
  const gameIdInput = document.querySelector('#game-id');
  if (gameIdInput) {
    const gameId = gameIdInput.value;

    chrome.storage.local.set({ 'owlbear-game-id': gameId }, () => {
      console.log('Owlbear game ID saved to chrome storage');
    });
  }

  function appendWarriors() {
    chrome.storage.local.get('dndbeyond-warriors', (data) => {
      const warriors = data['dndbeyond-warriors'];
      if (warriors && warriors.length > 0) {
        const iframe = document.querySelector("span[aria-label='Beyond health']").parentElement.parentElement.querySelector("iframe")
        if (iframe) {
          iframe.contentWindow.postMessage({ type: 'updateCombatants', warriors: warriors }, '*');
        }
      }
    });
  }

  setInterval(appendWarriors, 10000);
}

if (window.location.href.startsWith('https://www.dndbeyond.com/')) {
  handleDnDBeyond();
} else if (window.location.href.startsWith('https://www.owlbear.rodeo/')) {
  handleOwlbearRodeo();
}
