const fsPromises = require("fs/promises")
const request = require('supertest')
const express = require('express')
const jestOpenAPI = require('jest-openapi').default

// Load an OpenAPI file (YAML or JSON) into this plugin
jestOpenAPI(process.cwd() + '/docs/borga-api-spec.json')

/**
 * Setup express app
 */
const app = express()
const webAPI = require('../lib/borga-web-api')


app.use('/api', webAPI.router)

async function createUserForTesting(username) {
    return request(app)
        .put('/api/users')
        .send({ "name": username , "password": "123"})
        .then(resp => {
            return resp.body
        })
}

async function deleteTestingUser(user) {
    return request(app)
        .delete('/api/users')
        .set('Authorization', `Bearer ${user.token}`)
        .send()
        .then(resp => {
            if (resp.status == 200)
                return true
            return false
        })
}

async function createGroupForTesting(user, groupname) {
    return request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ "owner": user.token, "name": groupname, "description": groupname })
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            return resp.body
        })
}

async function createGameForTesting(user, group, id) {
    return request(app)
        .post(`/api/groups/${group.name}/games`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ "name": `${group.name}` })
        .send({ "id": `${id}` })
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            return resp.body
        })
}

test('Test version endpoint', async () => {
    return fsPromises.readFile(process.cwd() + "/version.json")
        .then(file => {
            request(app)
                .get('/api/version')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(resp => {
                    // Assert that the HTTP response satisfies the OpenAPI spec
                    expect(resp).toSatisfyApiSpec()
                    return expect(resp.text).toBe(file.toString())
                })
        }
        )
})

test('Test missing bearer in authenitcation', async () => {
    return request(app)
        .get(`/api/groups/1`)
        .set('Authorization', "123")
        .expect(401)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body).toStrictEqual({ "message": "Bearer token missing." })
        })
})


test('Test invalid token in authenitcation', async () => {
    return request(app)
        .get(`/api/groups/1`)
        .set('Authorization', "Bearer 123")
        .expect(401)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body).toStrictEqual({ "message": "Invalid token." })
        })
})


test('Test missing authentication', async () => {
    return request(app)
        .get(`/api/groups/1`)

        .expect(401)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body).toStrictEqual({ "message": "Bearer token missing." })
        })
})

test('Test invalid permission get groups', async () => {
    const user = await createUserForTesting("invalidPermissionsOnGroupApi")
    try {
        await request(app)
        .get('/api/groups/1')
        .set('Authorization', `Bearer ${user.token}`)
        .expect('Content-Type', /json/)
        .expect(401)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body.message).toBe("User doesn't have the group requested.")
        })
    } finally {
        await deleteTestingUser(user)
    }
})


test('Test create user', async () => {
    return request(app)
        .put('/api/users')
        .send({ "name": "teste123", "password": "123" })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(async resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body.name).toBe("teste123")
            return await deleteTestingUser(resp.body) 
        })
})

test('Test get groups', async () => {
    const user = await createUserForTesting("getGroupUserApi")
    try {
        await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${user.token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp.body.length).toBe(0)
            expect(resp).toSatisfyApiSpec()
        })
    } finally {
        await deleteTestingUser(user)
    }
    
})

test('Test create groups', async () => {
    const user = await createUserForTesting("createGroupUserApi")
    try {
        await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ "owner": user.token, "name": "teste", "description": "teste" })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body.owner).toStrictEqual(user.token)
            expect(resp.body.name).toStrictEqual("teste")
            expect(resp.body.description).toStrictEqual("teste")
            expect(resp.body.games).toStrictEqual([])
        })
    }
    finally {
        await deleteTestingUser(user)
    }
})

test('Test create group twice', async () => {
    const user = await createUserForTesting("createGroupTwiceUserApi")
    try {
        await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ "owner": user.token, "name": "teste", "description": "teste" })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body.owner).toStrictEqual(user.token)
            expect(resp.body.name).toStrictEqual("teste")
            expect(resp.body.description).toStrictEqual("teste")
            expect(resp.body.games).toStrictEqual([])
        })
        .then(async () => {
            return request(app)
                .post('/api/groups')
                .set('Authorization', `Bearer ${user.token}`)
                .send({ "owner": user.token, "name": "teste", "description": "teste" })
                .expect('Content-Type', /json/)
                .expect(409)
                .then(resp => {
                    // Assert that the HTTP response satisfies the OpenAPI spec
                    expect(resp).toSatisfyApiSpec()
                    expect(resp.body.message).toBe("Group Name already exists.")
                })
        })
    } finally {
        await deleteTestingUser(user)
    }
})

test('Test get group name', async () => {
    const user = await createUserForTesting("getGroupNameUserApi")
    const group = await createGroupForTesting(user, "getGroupName")
    try {
        await request(app)
        .get(`/api/groups/${group.name}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body.owner).toStrictEqual(user.token)
            expect(resp.body.name).toStrictEqual("getGroupName")
            expect(resp.body.description).toStrictEqual("getGroupName")
            expect(resp.body.games).toStrictEqual([])
        })
    } finally {
        await deleteTestingUser(user)
    }
})

test('Test edit group name', async () => {
    const user = await createUserForTesting("editGroupNameUserApi")
    const group = await createGroupForTesting(user, "editGroupName")
    try {
        await request(app)
        .put(`/api/groups/${group.name}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ "owner": user.token, "name": "newGroupName", "description": "newGroupNameDescription" })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body.owner).toStrictEqual(user.token)
            expect(resp.body.name).toStrictEqual("newGroupName")
            expect(resp.body.description).toStrictEqual("newGroupNameDescription")
            expect(resp.body.games).toStrictEqual([])
        })
    } finally {
        await deleteTestingUser(user)
    }
})

test('Test delete group name', async () => {
    const user = await createUserForTesting("deleteGroupNameUserApi")
    const group = await createGroupForTesting(user, "deleteGroupName")
    try {
        await request(app)
        .delete(`/api/groups/${group.name}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ "name": `${group.name}` })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body.owner).toStrictEqual(user.token)
            expect(resp.body.name).toStrictEqual("deleteGroupName")
            expect(resp.body.description).toStrictEqual("deleteGroupName")
            expect(resp.body.games).toStrictEqual([])
        })
    } finally {
        await deleteTestingUser(user)
    }
})

test('Test add game to group', async () => {
    const user = await createUserForTesting("addGameGroupUserApi")
    const group = await createGroupForTesting(user, "addGameGroup")
    try {
        await request(app)
        .post(`/api/groups/${group.name}/games`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ "name": `${group.name}` })
        .send({ "id": "TAAifFP590"})
        .expect('Content-Type', /json/)
        .expect(200)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body.id).toStrictEqual("TAAifFP590")
            expect(resp.body.name).toStrictEqual("Root")
        })
    } finally {
        await deleteTestingUser(user)
    }
})

test('Test delete game from group', async () => {
    const user = await createUserForTesting("deleteGameGroupUserApi")
    const group = await createGroupForTesting(user, "deleteGameGroup")
    const game = await createGameForTesting(user, group, 'TAAifFP590')
    try {
        await request(app)
        .delete(`/api/groups/${group.name}/games/${game.id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(resp => {
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(resp).toSatisfyApiSpec()
            expect(resp.body.id).toStrictEqual("TAAifFP590")
            expect(resp.body.name).toStrictEqual("Root")
        })
    } finally {
        await deleteTestingUser(user)
    }
})