window.onload = setup

function setup() {
    const userName = document.getElementById('Username')
    const userPassword = document.getElementById('floatingPassword')
    const signIn = document.getElementById('sign-in-btn')
    if (signIn)
        signIn.addEventListener('click', () => handlerSignIn(userName, userPassword))
    const signUp = document.getElementById('sign-up-btn')
    if (signUp)
        signUp.addEventListener('click', () => handlerSignUp(userName, userPassword))  
}

async function handlerSignUp(userName, userPassword) {
    try {
        if (!userName.value){
            alertPanel(400, "Invalid username")
            return
        }
        if (!userPassword.value){
            alertPanel(400, "Invalid password")
            return
        }
        const username = userName.value
        const password = await digest(userPassword.value)
        const path = '/users'
        const resp = await fetch(path, {
            method : 'PUT',
            body : JSON.stringify({"name": username, "password": password}),
            headers: {'Content-Type' : 'application/json'}
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

async function handlerSignIn(userName, userPassword) {
    try {
        if (!userName.value){
            alertPanel(400, "Invalid username")
            return
        }
        if (!userPassword.value){
            alertPanel(400, "Invalid password")
            return
        }
        const username = userName.value
        const password = await digest(userPassword.value)
        const path = '/login'
        const resp = await fetch(path, {
            method : 'POST',
            body : JSON.stringify({"name": username, "password": password}),
            headers: {'Content-Type' : 'application/json'},
        })

        if (resp.redirected) {
            window.location.href = resp.url
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

async function digest(message) {
    const msgUint8 = new TextEncoder().encode(message)                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer))                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') // convert bytes to hex string
    return hashHex
}