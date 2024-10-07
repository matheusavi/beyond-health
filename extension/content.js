alert("extension loaded");
// Define a function to execute code on dndbeyond.com
function handleDnDBeyond() {
  function getWarriors() {
    let warriors = document.querySelectorAll('.combatant-card');
    let result = [];
    warriors.forEach(x => result.push({
      name: x.querySelector('.combatant-summary__name')?.innerText,
      hp: x.querySelector('.combatant-card__hp-current')?.innerText
    }));

    // Store the result in Chrome storage
    chrome.storage.local.set({ 'dndbeyond-warriors': result }, () => {
      console.log('Warriors data saved to chrome storage');
    });
  }
  setInterval(getWarriors, 10000);
}

// Define a function to execute code on owlbear.rodeo
function handleOwlbearRodeo() {
  const gameIdInput = document.querySelector('#game-id');
  if (gameIdInput) {
    const gameId = gameIdInput.value;

    // Store the game ID in Chrome storage
    chrome.storage.local.set({ 'owlbear-game-id': gameId }, () => {
      console.log('Owlbear game ID saved to chrome storage');
    });
  }

  // Append a list of the warriors stored on dndbeyond to a div inside the iframe using postMessage every 10 seconds
  function appendWarriors() {
    console.log("append warriors");
    chrome.storage.local.get('dndbeyond-warriors', (data) => {
      const warriors = data['dndbeyond-warriors'];
      if (warriors && warriors.length > 0) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          // Send the warriors data to the iframe using postMessage
          iframe.contentWindow.postMessage({ type: 'updateCombatants', warriors: warriors }, '*');
        }
      }
    });
  }

  setInterval(appendWarriors, 10000);
}

if (window.location.href.startsWith('https://www.dndbeyond.com/')) {
  alert("handle beyond");
  handleDnDBeyond();
} else if (window.location.href.startsWith('https://www.owlbear.rodeo/')) {
  alert("handle rodeo");
  handleOwlbearRodeo();
}
