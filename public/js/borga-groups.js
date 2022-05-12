window.onload = setup

function setup() {
    const btnDanger = document.querySelectorAll('.btn-danger')
    if (btnDanger)
        btnDanger.forEach(elem => elem.addEventListener('click', () => handlerDeleteGroup(elem)))
    const signOut = document.getElementById('sign-out-btn')
    if (signOut)
        signOut.addEventListener('click', () => handlerSignOut())    
}

async function handlerSignOut() {
    try {
        const path = '/logout'
        const resp = await fetch(path, {
            method : 'DELETE',
            credentials: "same-origin"
        })
        if (resp.redirected) {
            window.location.href = resp.url;
            return
        }

        if(resp.status != 201) {
            const msg = await resp.json()
            alertPanel(resp.status, msg.message)
            return
        }

    } catch (err) {
        alertPanel('There was an error', err)
    }
}

/**
 * 
 * @param {Element} btDelete 
 */
async function handlerDeleteGroup(btDelete) {
    try {
        const groupName = btDelete.dataset.groupName
        const url = document.location.href.replace('/groups', '/api/groups') + '/' + groupName
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