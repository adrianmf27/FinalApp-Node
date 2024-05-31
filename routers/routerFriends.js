const express = require('express');

const routerFriends = express.Router();
const database = require("../database")

routerFriends.post("/", async(req, res) => {
    let friendEmail = req.body.email

    if (!friendEmail || friendEmail == undefined || friendEmail == null || friendEmail == "") {
        return res.status(400).json({ error: "Friend email is required" });
    }

    database.connect()
    let insertedFriend = null;

    try
    {
        insertedFriend = await database.query("INSERT INTO FRIENDS VALUES (?, ?)", 
            [req.infoInApiKey.email, friendEmail])
    }
    catch (e)
    {
        database.disConnect()
        return res.status(400).json({error: e})
    }
    
    database.disConnect();
    res.json({inserted: insertedFriend})
})

routerFriends.get("/", async (req, res) => {
    let userEmail = req.infoInApiKey.email

    if (userEmail == undefined) {
        return res.status(400).json({ error: "User not found" });
    }

    database.connect()
    let friends = await database.query("SELECT emailFriend FROM FRIENDS where emailUser = ?", [userEmail])

    if(friends.length == 0)
    {
        return res.status(400).json({error: "This user has no friends"})
    }

    database.disConnect()
    res.send(friends)
})

routerFriends.get("/friend", async (req, res) => {
    let friendEmail = req.query.emailFriend
    let userEmail = req.infoInApiKey.email

    if (userEmail == undefined) {
        return res.status(400).json({ error: "User not found" });
    }

    if (friendEmail == undefined) {
        return res.status(400).json({ error: "Friend not found" });
    }

    database.connect()
    let friends = []
    try
    {
        friends = await database.query("SELECT emailFriend FROM FRIENDS"
        + " where emailUser = ? and emailFriend = ?", [userEmail, friendEmail])
    }
    catch(e)
    {
        database.disConnect
        res.send({error: e})
    }

    database.disConnect()
    res.send(friends)
})


routerFriends.delete("/:emailFriend", async (req, res) => {
    let emailFriend = req.params.emailFriend
    let userEmail = req.infoInApiKey.email

    if (emailFriend == undefined) {
        return res.status(400).json({ error: "Friend email is required" });
    }

    database.connect()
    try
    {
        await database.query('DELETE FROM friends WHERE emailUser = ? AND emailFriend = ?', 
            [userEmail, emailFriend])
    }
    catch (e)
    {
        database.disConnect()
        return res.status(400).json({error: e})
    }

    database.disConnect()
    res.json({deleted: true})
})

module.exports = routerFriends