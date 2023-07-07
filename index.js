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

//Assign students to mentor
app.post("/assign_mentor",async(req,res)=>{
    const data=req.body;

    //Update mentors collection in DB
    const result=await client
    .db("mentor-student")
    .collection("mentors")
    .updateOne(
        {mentor_name:data.mentor_name},
        {$set:{students_assigned:data.students_assigned}}
    )

    data.students_assigned.map(async(student)=>{
        //update the student collection with data 
        await client
        .db("mentor-student")
        .collection("students")
        .updateOne(
          {student_name:student},
          {$set:{mentor_assigned:true,mentor_name:data.mentor_name}}  
        )
    })
    //res.
    result.acknowledged
    ?res.status(200).send({msg:"students assigned successfully!"})
    :res.status(400).send({msg:"Something went worong..Please try again"})
})

//to add mentor
//To update the mentor
// Remove student from student_assigned with mentor=>Update mentor field of the student 
// =>Add the student with new mentor 
//change the mentor 
app.post("/change_mentor",async(req,res)=>{
    const data=req.body;

    //remove the student from student_assigned array of previous mentor
    await client 
    .db("mentor-student")
    .collection("mentors")
    .updateOne(
        {mentor_name:data.previous_mentor},
        {$pull:{students_assigned:data.student_name}}
    );
    //update mentors name field of student
    await client
    .db("mentor-student")
    .collection("students")
    .updateOne(
        {student_name:data.student_name},
        {$set:{mentor_name:data.new_mentor}}
    )

    //add the student to new mentor ->mentor collection 
    const result=await client
    .db("mentor-student")
    .collection("mentors")
    .updateOne(
        {mentor_name:data.new_mentor},
        {$push:{students_assigned:data.student_name}}  //add student name to students_assigned 
    );

    result.acknowledged
    ?res.status(200).send({msg:"Teacher Changed Successfully"})
    :res.status(400).send({msg:"Something went wrong.."})

})




app.listen(PORT,()=>{
    console.log("Server Started on port " + PORT);
})