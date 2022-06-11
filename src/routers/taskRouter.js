const express = require("express")
const Task = require("../models/Taskmodel")
const auth = require("../middleware/auth")
const taskRouter = new express.Router()

taskRouter.post("/tasks", auth, async(req, res)=>{
    
    const newtask = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await newtask.save()
        res.status(200).send(newtask)
    } catch (error) {
        res.status(500).send(error)
    }
})



taskRouter.get("/tasks", auth, async(req, res)=>{
    const match = {}

    if(req.query.completed){
        match.completed = req.query.completed === "true"
    }

    try {
        await req.user.populate({
            path: "tasks",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
            }
            
        })
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

taskRouter.get("/tasks/:id", auth, async(req, res)=>{
    const _id = req.params.id
    
    try {
        const task = await Task.findOne({_id, owner: req.user._id})
        
        if(!task){
            return res.status(404).send("no task found")
        }

        res.status(200).send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

taskRouter.patch("/tasks/:id", auth, async(req, res)=>{
    const _id = req.params.id
    const updates = Object.keys(req.body)
    const allowedUpdates = ["description", "completed"]
    const validOperation = updates.every((update)=>{
        return allowedUpdates.includes(update)
    })

    if (!validOperation){
        return res.status(400).send("Invalid update")
    }
    try {
        const task = await Task.findOne({_id, owner: req.user._id})

        if(!task){
            return res.status(404).send("task not found")
        }

        updates.forEach((update)=>{
            task[update] = req.body[update]
        })

        await task.save()
        // const newTask = await Task.findByIdAndUpdate(id, req.body, {new: true, runValidators: true})
        res.status(200).send(task)
    } catch (error) {
        if(error.kind === "ObjectId"){
            return res.send("no task found")
        }
        res.status(500).send(error)
    }
})

taskRouter.delete("/tasks/:id", auth, async(req, res)=>{
    const _id = req.params.id
    try {
        const deletedTask = await Task.findOneAndDelete({_id, owner: req.user._id})

        if(!deletedTask){
            return res.status(404).send("task not found")
        }
        res.status(200).send(deletedTask)
    } catch (error) {
        if(error.kind=="ObjectId"){
            return res.status(404).send("task not found")
        }
        res.status(500).send(error)
    }
})

module.exports = taskRouter
