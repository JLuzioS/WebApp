const fsPromises = require("fs/promises")
const request = require('supertest')
const express = require('express')

const hbs = require('hbs')
hbs.registerPartials( `${__dirname}/../views/partials`, function (err) {})


/**
 * Setup express app
 */
const app = express()
const webSite= require('../lib/borga-web-site')
const { fail } = require("assert")
app.use(express.static('public'))


app.use(webSite.router)

app.set('view engine', 'hbs')

async function createUserForTesting(username) {
    const resp = await request(app)
        .put('/users')
        .send({ "name": username, "password": 123})

    return {"cookie": resp.headers["set-cookie"]}
}


async function deleteTestingUser(headers) {
    await request(app)
        .delete('/users')
        .set(headers)
        .send({})
        .then(resp => {
            if (resp.status == 200)
                return true
            return false
        })

}

async function createGroupForTesting(headers, groupname) {
    return request(app)
        .post('/groups')
        .set(headers)
        .send({ "name": groupname, "description": groupname })
        .then(resp => {
            return resp.body
        })
}

async function createGameForTesting(headers, groupname, id) {
    return request(app)
        .post(`/groups/${groupname}/games`)
        .set(headers)
        .send({ "name": `${groupname}` , "id": `${id}`})
        .then(resp => {
            return resp.body
        })
}

test('Test site alive', async () => {
    return request(app)
        .get(`/`)
        .expect(200)
        .then(resp => {
            expect(resp.statusCode).toBe(200)
        })
})

test('Test missing bearer in authentication', async () => {
    return request(app)
        .get(`/groups/1`)
        .set('Authorization', "123")
        .expect(401)
        .then(resp => {
            expect(resp.body).toStrictEqual({ "message": "Bearer token missing." })
        })
})


test('Test invalid token in authentication', async () => {
    return request(app)
        .get(`/groups/1`)
        .set('Authorization', "Bearer 123")
        .expect(401)
        .then(resp => {
            expect(resp.body).toStrictEqual({ "message": "Invalid token." })
        })
})


test('Test missing authentication', async () => {
    return request(app)
        .get(`/groups/1`)
        .expect(401)
        .then(resp => {
            expect(resp.body).toStrictEqual({ "message": "Bearer token missing." })
        })
})

test('Test invalid permission get groups', async () => {
    const headers = await createUserForTesting("invalidPermissionsOnGroup")
    try {
        await request(app)
            .get('/groups/1')
            .set(headers)
            .expect('Content-Type', /json/)
            .expect(401)
            .then(resp => {
                expect(resp.body.message).toBe("User doesn't have the group requested.")
            })
    } finally {
        await deleteTestingUser(headers)
    }

})

test('Test get groups', async () => {
    const headers = await createUserForTesting("getGroupUser")
    try {
        await request(app)
        .get('/groups')
        .set(headers)
        .expect(200)
        .then(resp => {
            expect(resp.text.indexOf("getGroupUser") >= 0).toBe(true)
        })
    }
    finally {
        await deleteTestingUser(headers)
    }
})

test('Test create groups', async () => {
    const headers = await createUserForTesting("createGroupUser")
    try{
        await request(app)
        .post('/groups')
        .set(headers)
        .send({ "name": "teste", "description": "teste" })
        .expect(302)
    }
    finally {
        await deleteTestingUser(headers)
    }
})

test('Test get group name', async () => {
    const headers = await createUserForTesting("getGroupNameUser")
    const group = await createGroupForTesting(headers, "getGroupName")
    try {
        await request(app)
            .get(`/groups/getGroupName`)
            .set(headers)
            .expect(200)
            .then(resp => {
                expect(resp.text.indexOf("getGroupName") >= 0).toBe(true)
            })
    }
    finally {
        await deleteTestingUser(headers)
    }
})

test('Test add game to group', async () => {
    const headers = await createUserForTesting("addGameGroupUser")
    const group = await createGroupForTesting(headers, "addGameGroup")
    try {
        await request(app)
            .post(`/groups/addGameGroup/games`)
            .set(headers)
            .send({ "name": `addGameGroup` })
            .send({ "id": "TAAifFP590", "name": "root" })
            .expect(302)
    }
    finally {
        await deleteTestingUser(headers)
    }
})


test('Test get list of two games', async () => {
    const headers = await createUserForTesting("getListGameUserTwoGames")
    const group = await createGroupForTesting(headers, "getListGame")
    try {
        await request(app)
            .get(`/groups/getListGame/games`)
            .set(headers)
            .query({"name" : "root"})
            .query({"limit" : "2"})
            .expect(200)
            .then(resp => {
                expect(resp.text.length >= 613).toBe(true) // 613 is the length of html with zero games returned
            })
        }
    finally {
        await deleteTestingUser(headers)
    }
}, 15000)

test('Test get list of zero games', async () => {
    const headers = await createUserForTesting("getListGameUserZero")
    const group = await createGroupForTesting(headers, "getListGame")
    try {
        await request(app)
            .get(`/groups/getListGame/games`)
            .set(headers)
            .query({"name" : "xxxx"})
            .query({"limit" : "2"})
            .then(resp => {
                expect([429, 302]).toContain(resp.status)
                expect(resp.text.length == 892).toBe(true) // 613 is the length of html with zero games returned
            })
    }
    finally {
        await deleteTestingUser(headers)
    }
}, 15000)

test('Test get Group game', async () => {
    const headers = await createUserForTesting("getGroupGameUserGame")
    const group = await createGroupForTesting(headers, "getGroupGame")
    const game = await createGameForTesting(headers, "getGroupGame", "TAAifFP590")
    try {
        await request(app)
            .get(`/groups/getGroupGame/game/TAAifFP590`)
            .set(headers)
            .expect(200)
            .then(resp => {
                expect(resp.text.indexOf("TAAifFP590") >= 0).toBe(true)
            })
    }
    finally {
        await deleteTestingUser(headers)
    }
})