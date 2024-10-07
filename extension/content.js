function getWarriors() {
  let warriors = document.querySelectorAll('.combatant-card')
  let result = []
  warriors.forEach(x => result.push({
    name: x.querySelector('.combatant-summary__name')?.innerText,
    hp: x.querySelector('.combatant-card__hp-current')?.innerText
  }))
  alert(JSON.stringify(result))
}
setInterval(getWarriors, 10000)
