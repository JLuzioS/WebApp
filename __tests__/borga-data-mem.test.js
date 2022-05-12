'use strict'

const {expect} = require('@jest/globals')
const tester = require('../lib/borga-data-mem')

test('Test create group, list it and delete it', async () => {
    const user = await tester.createUser('TestUser')
    const name = 'Test group'
    const description = 'Group for testing'
    await tester.createGroup(user, name, description)

    let allGroups = await tester.listAllGroups(user)
    
    expect(allGroups.length).toBe(1)

    const group = await tester.getGroupDetails(user, name)

    expect(group.name).toBe(name)
    expect(group.description).toBe(description)
    expect(group.games.length).toBe(0)

    await tester.deleteGroup(user, name)
    allGroups = await tester.listAllGroups(user)
    expect(allGroups.length).toBe(0)
})


test('Test create and edit group name and description', async () => {
    const user = await tester.createUser('TestUser')
    const oldName = 'Test group'
    const oldDescription = 'Group for testing'
    await tester.createGroup(user, oldName, oldDescription)
    
    let group = await tester.getGroupDetails(user, oldName)

    const allGroups = await tester.listAllGroups(user)

    expect(group.name).toBe(oldName)
    expect(group.description).toBe(oldDescription)

    const newName = 'Edited Test Group'
    const newDescription = 'Edited Description'
    await tester.editGroup(user, oldName, newName, newDescription)
    
    expect(allGroups.length).toBe(1)

    group = await tester.getGroupDetails(user, newName)
    expect(group.name).toBe(newName)
    expect(group.description).toBe(newDescription)

    await tester.deleteGroup(user, newName)
})

test('Test create and edit group description', async () => {
    const user = await tester.createUser('TestUser')
    const groupName = 'Test group'
    const oldDescription = 'Group for testing'
    await tester.createGroup(user, groupName, oldDescription)
    
    let group = await tester.getGroupDetails(user, groupName)

    const allGroups = await tester.listAllGroups(user)

    expect(group.name).toBe(groupName)
    expect(group.description).toBe(oldDescription)

    const newDescription = 'Edited Description'
    await tester.editGroup(user, groupName, groupName, newDescription)
    
    expect(allGroups.length).toBe(1)

    group = await tester.getGroupDetails(user, groupName)
    expect(group.name).toBe(groupName)
    expect(group.description).toBe(newDescription)

    await tester.deleteGroup(user, groupName)
})


test('Test create group and get its details', async () => {
    const user = await tester.createUser('TestUser')
    const name = 'Test group'
    const description = 'Group for testing'
    const group = await tester.createGroup(user, name, description)

    expect(group.name).toBe(name)
    expect(group.description).toBe(description)
    expect(group.games.length).toBe(0)

    await tester.deleteGroup(user, name)
})

test('Test Add a game to it', async () => {
    const user = await tester.createUser('TestUser')
    const name = 'Test group'
    const description = 'Group for testing'
    const group = await tester.createGroup(user, name, description)

    const game = {'id' : 123, 'name' : 'Game Test'}
    await tester.addGameToGroup(user, name, game)

    expect(group.games.length).toBe(1)
    expect(group.games[0]).toBe(game)

    await tester.deleteGroup(user, name)
})

test('Test remove a game', async () => {
    const user = await tester.createUser('TestUser')
    const name = 'Test group'
    const description = 'Group for testing'
    const group = await tester.createGroup(user, name, description)
    
    const game = {'id' : 123, 'name' : 'Game Test'}
    await tester.addGameToGroup(user, name, game)

    expect(group.games.length).toBe(1)
    expect(group.games[0]).toBe(game)

    await tester.removeGameFromGroup(user, name, game.id)
    expect(group.games.length).toBe(0)

    await tester.deleteGroup(user, name)
})

test('Test create user', async () => {
    const name = 'New User'
    const user = await tester.createUser(name)

    expect(user.name).toBe(name)
    expect(user.token.length).toBeGreaterThan(0)
})

test('Test try to add a group that already exists', async () => {
    const user = await tester.createUser('TestUser')
    const name = 'Test group'
    const description = 'Group for testing'
    const group = await tester.createGroup(user, name, description)

    try {
        await tester.createGroup(user, name, description)
        fail()
    } catch(e) {
        expect(e.message).toBe('Group Name already exists.')
        expect(e.status).toBe(409)
    } finally {
        await tester.deleteGroup(user, name)
    }
})

test('Test try to edit a group that doesnt exists', async () => {
    const user = await tester.createUser('TestUser')
    const name = 'Test group'
    const description = 'Group for testing'

    try {
        await tester.editGroup(user, 'TestGroup', 'TestGroupName', 'TestDescription')
        await tester.deleteGroup(user, name)
        fail()
    } catch(e) {
        expect(e.message).toBe('Group not found')
        expect(e.status).toBe(404)
    }
})

test('Test try to add a game that already exists', async () => {
    const user = await tester.createUser('TestUser')
    const name = 'Test group'
    const description = 'Group for testing'
    await tester.createGroup(user, name, description)

    const game = {'id' : 123, 'name' : 'Game Test'}
    await tester.addGameToGroup(user, name, game)

    try {
        await tester.addGameToGroup(user,name, game)
        fail()
    } catch (e) {
        expect(e.message).toBe('Game already exists')
        expect(e.status).toBe(409)
    }finally {
        await tester.deleteGroup(user, name)
    }
})

test('Test remove game that doesnt exists', async () => {
    const user = await tester.createUser('TestUser')
    const name = 'Test group'
    const description = 'Group for testing'
    const group = await tester.createGroup(user, name, description)

    const game = {'id' : 123, 'name' : 'Game Test'}
    await tester.addGameToGroup(user, name, game)

    try {
        await tester.removeGameFromGroup(user, name, '456')
        fail()
    } catch (e) {
        expect(e.message).toBe('Game not found')
        expect(e.status).toBe(404)
    } finally {
        await tester.deleteGroup(user, name)
    }
})

test('Test delete group that doesnt exist', async () => {
    const user = await tester.createUser('TestUser')
    const name = 'Test group'
    const description = 'Group for testing'
    const group = await tester.createGroup(user, name, description)

    try{
        await tester.deleteGroup(user, 'Group123')
        fail()
    } catch(e) {
        expect(e.message).toBe('Group not found')
        expect(e.status).toBe(404)
    } finally {
        await tester.deleteGroup(user, name)
    }
    
})

test('Test empty user', async () => {
    try{
        await tester.createGroup()
        fail()
    } catch(e) {
        expect(e.message).toBe('Missing user')
        expect(e.status).toBe(400)
    }
})

test('User doesnt exists', async () => {
    try{
        await tester.createGroup('123', 'Group', 'Description')
        fail()
    } catch(e) {
        expect(e.message).toBe('User not Found')
        expect(e.status).toBe(404)
    }
})

test('Get user given a token', async () => {
    const user = await tester.createUser('UserName')
    expect(user).toBe(await tester.getUserByToken(user.token))
})

test('Get user that doesnt exists', async () => {
    try{
        const user = await tester.getUserByToken('123')
        expect(user).toBe(user)
        fail()
    } catch(e) {
        expect(e.message).toBe('Missing user')
        expect(e.status).toBe(400)
    }
})

test('Wrong parameter', async () => {
    try{
        const user = await tester.createUser('UserName')
        await tester.createGroup(user)
        fail()
    } catch(e) {
        expect(e.message).toBe('Missing parameter')
        expect(e.status).toBe(400)
    }
})