import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app=express();
const PORT=process.env.PORT;
const MONGO_URL=process.env.MONGO_URL;

app.use(express.json());//middleware
app.use(cors());//middleware


app.get("/",(req,res)=>{
    res.send("<h1>Server is Live...</h1>")
})
const createConnection=async()=>{
    //create a new MongoClient instance
    const client=new MongoClient(MONGO_URL);
    //connect to Mongodb server using above client-url
    await client.connect();
    console.log("MongoDB connection Established...");
    return client;

}
//Calling it
const client= await createConnection();


//Add endpoint to add a mentor to db
app.post("/create-mentor",async(req,res)=>{
    //getting the mentor data from req.body
    const data=req.body;

    // /insert  db-mentor-student collection-mentors
    //insert the data into the mentors using db
    const result=await client
    .db("mentor-student")
    .collection("mentors")
    .insertOne(data);


    //send the response based on result of the db operation
    result.acknowledged
    ?res.status(200).send({msg:"mentor added successfully"})
    :res.status(400).send({msg:"Something went wrong!!please try again..."})

})




//Endpoint to list all mentors
app.get("/mentor-list",async(req,res)=>{
    const result=await client 
    .db("mentor-student")
    .collection("mentors")
    .find({})
    .toArray();
    res.send(result);//send the retireved mentors as response to console.
})

//create endpoint for student
app.post("/create-student",async (req,res)=>{
     const data=req.body;

     //inserting the student data into collection ->students
     const result=await client
     .db("mentor-student")
     .collection("students")
     .insertOne(data);

     //send a response
     result.acknowledged
     ?res.status(200).send({msg:"Student added Successfully"})
     :res.status(400).send({msg:"Something went wrong in student collection.Please try Again.."})
})


//create an api endpoint unassigned_students
// list of all the students that are not assigned a mentor 
app.get("/unassigned_students",async(req,res)=>{
    const result=await client
    .db("mentor-student")
    .collection("students")
    .find({"mentor_assigned":false})
    .toArray();//retrieving all the unassigned student with mentor from stduents collection 

    res.send(result);
})

//create an endpoint assigned students
app.get("/assigned_students",async(req,res)=>{
    const result=await client 
    .db("mentor-student")
    .collection("students")
    .find({"mentor_assigned":true})
    .toArray();
    res.send(result);
})


app.listen(PORT,()=>{
    console.log("Server Started on port " + PORT);
})