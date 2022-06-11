//Express Config
const express = require("express")
const app = express()

//Mongoose connection
require("./db/mongoose")

//Routers
const userRouter = require("./routers/userRouter")
const taskRouter = require("./routers/taskRouter")

//Server ports
const port = process.env.PORT 


//Express Usage
app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

//Server route
app.listen(port, ()=>{
    console.log("server up on port " + port)
})

