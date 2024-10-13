function handleDnDBeyond() {
  let listenerInterval;
  let previousObservers = [];

  function getFields() {
    return document.querySelectorAll('.combatant-card');
  }

  function addObserversToFields(fields) {
    previousObservers.forEach(observer => observer.disconnect());
    previousObservers = [];

    fields.forEach(field => {
      const nameField = field.querySelector('.combatant-summary__name');
      const hpField = field.querySelector('.combatant-card__hp-current');
      const maxHpField = field.querySelector('.combatant-card__hp-max');
      if (nameField) {
        const observer = new MutationObserver(() => {
          saveWarriors();
        });
        observer.observe(nameField, { characterData: true, childList: true, subtree: true });
        previousObservers.push(observer);
      }

      if (hpField) {
        const observer = new MutationObserver(() => {
          saveWarriors();
        });
        observer.observe(hpField, { characterData: true, childList: true, subtree: true });
        previousObservers.push(observer);
      }

      if (maxHpField) {
        const observer = new MutationObserver(() => {
          saveWarriors();
        });
        observer.observe(maxHpField, { characterData: true, childList: true, subtree: true });
        previousObservers.push(observer);
      }
    });
  }

  function saveWarriors() {
    let warriors = [];
    const fields = getFields();
    fields.forEach(x => warriors.push({
      name: x.querySelector('.combatant-summary__name')?.innerText,
      hp: x.querySelector('.combatant-card__hp-current')?.innerText,
      maxHp: x.querySelector('.combatant-card__hp-max')?.innerText
    }));

    chrome.storage.local.set({ 'dndbeyond-warriors': warriors });
  }

  function refreshObservers() {
    const fields = getFields();
    if (fields.length > 0) {
      addObserversToFields(fields);
    }
  }

  function cleanupOldRecords() {
    chrome.storage.local.get(null, (data) => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const updatedData = {};

      for (let key in data) {
        if (data[key].timestamp && now - data[key].timestamp > oneDay) {
          continue;
        } else {
          updatedData[key] = data[key];
        }
      }

      chrome.storage.local.set(updatedData);
    });
  }

  function initObservers() {
    try {
      const fields = getFields();
      if (fields.length > 0) {
        addObserversToFields(fields);
        saveWarriors();
        clearInterval(listenerInterval);
      }
    } catch (error) {
      console.error('Error while setting up observers:', error);
    }
  }

  listenerInterval = setInterval(initObservers, 5000);

  setInterval(() => {
    try {
      refreshObservers();
    } catch (error) {
      console.error('Error during refresh observers:', error);
    }
  }, 60000);

  setInterval(() => {
    try {
      cleanupOldRecords();
    } catch (error) {
      console.error('Error during cleanup old records:', error);
    }
  }, 5 * 60 * 1000);

  console.log('DnD Beyond handler initiated successfully');
}

function handleOwlbearRodeo() {
  function appendWarriors() {
    chrome.storage.local.get('dndbeyond-warriors', (data) => {
      const warriors = data['dndbeyond-warriors'];
      if (warriors && warriors.length > 0) {
        const iframeParent = document.querySelector("span[aria-label='Beyond health']");
        if (iframeParent && iframeParent.parentElement && iframeParent.parentElement.parentElement) {
          const iframe = iframeParent.parentElement.parentElement.querySelector("iframe");
          if (iframe) {
            iframe.contentWindow.postMessage({ type: 'updateCombatants', warriors: warriors }, '*');
            console.log("Warriors sent to dnd beyond");
          }
        }
      } else {
        console.log("No warrior data to send");
      }
    });
  }

  function initIframeListeners() {
    let attempts = 0;
    const iframeCheckInterval = setInterval(() => {
      const iframeParent = document.querySelector("span[aria-label='Beyond health']");
      if (iframeParent && iframeParent.parentElement && iframeParent.parentElement.parentElement) {
        const iframe = iframeParent.parentElement.parentElement.querySelector("iframe");
        if (iframe) {
          clearInterval(iframeCheckInterval);
          setTimeout(() => {
            appendWarriors();
            setInterval(() => {
              try {
                appendWarriors();
              } catch (error) {
                console.error('Error while appending warriors to Owlbear:', error);
              }
            }, 2 * 60 * 1000);
          }, 5000);
        }
      }
      attempts++;
      if (attempts >= 5) {
        clearInterval(iframeCheckInterval);
      }
    }, 5000);
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes['dndbeyond-warriors']) {
      appendWarriors();
    }
  });

  initIframeListeners();

  console.log('Owlbear Rodeo handler initiated successfully');
}

try {
  if (window.location.href.startsWith('https://www.dndbeyond.com/')) {
    if (window.location.href.indexOf("combat-tracker") > 0) {
      handleDnDBeyond();
    }
    else
      window.navigation.addEventListener("navigate", (event) => {
        const url = new URL(event.destination.url);

        if (url.pathname.startsWith("combat-tracker")) {
          handleDnDBeyond();
        }
      })
  } else if (window.location.href.startsWith('https://www.owlbear.rodeo/')) {
    handleOwlbearRodeo();
  }
} catch (error) {
  console.error('Error during initialization:', error);
}
