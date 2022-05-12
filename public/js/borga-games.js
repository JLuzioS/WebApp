window.onload = setup

function setup() {
    const addGameBtn = document.getElementById('AddGameBtn')
    if (addGameBtn)
        addGameBtn.addEventListener('click', () => addGame(addGameBtn))    
}

async function addGame(addGameBtn) {
    try {
        const gameName = addGameBtn.dataset.gameName
        const gameId = addGameBtn.dataset.gameId
        const resp = await fetch(document.location.href, {
            body:  JSON.stringify({"id": gameId, "name": gameName}),
            headers: {'Content-Type' : 'application/json'},
            method: 'POST', 
            credentials: 'same-origin',
            })
        if (resp.redirected) {
            window.location.replace(resp.url)
            return
        }

        if(resp.status != 200) {
            const msg = await resp.text()
            alertPanel('ERROR ' + resp.status + ': ' + resp.statusText, msg)
            return
        }
    } catch(err) {
        alertPanel('ERROR', err)
    }
}