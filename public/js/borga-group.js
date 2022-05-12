window.onload = setup

function setup() {
    const btnDanger = document.querySelectorAll('.btn-danger')
    if (btnDanger)
        btnDanger.forEach(elem => elem.addEventListener('click', () => handlerDeleteGame(elem)))
}

/**
 * 
 * @param {Element} btDelete 
 */
async function handlerDeleteGame(btDelete) {
    try {
        const gameId = btDelete.dataset.gameId
        const url = document.location.href.replace('/groups', '/api/groups') + '/games/' + gameId 
        const resp = await fetch(url, { method: 'DELETE', credentials: 'same-origin'})
        if(resp.status != 200) {
            const msg = await resp.text()
            alertPanel('ERROR ' + resp.status + ': ' + resp.statusText, msg)
            return
        }
        btDelete
            .parentElement // get the TD element
            .parentElement // get the TR element
            .remove()
    } catch(err) {
        alertPanel('ERROR', err)
    }
}