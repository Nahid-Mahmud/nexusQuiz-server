const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// running port number
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_Pass}@cluster0.htztern.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // data collection

    const usersCollection = client.db("nexuxQuiz").collection("users");

    const quizCollection = client.db("nexuxQuiz").collection("quizes");
    const scoresCollection = client.db("nexuxQuiz").collection("scores");

    // custom middlewares
    // verify token
    const veryfyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "Forbidden" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // jwt related apis
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "8760h",
      });
      res.send({ token });
    });

    // user related apis
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // get indivisual user data
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    // quiz related apis
    app.get("/quizes", async (req, res) => {
      const cursor = quizCollection.find({});
      const quizes = await cursor.toArray();
      res.send(quizes);
    });

    // get single quiz
    app.get("/quiz/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const quiz = await quizCollection.findOne(query);
      res.send(quiz);
    });

    // post quiz
    app.post("/quizes", veryfyToken, async (req, res) => {
      const quiz = req.body;
      const result = await quizCollection.insertOne(quiz);
      res.send(result);
    });

    // delete quiz
    app.delete("/quizes/:id", veryfyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await quizCollection.deleteOne(query);
      res.send(result);
    })

    // update quiz
    app.put("/quizes/:id", veryfyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedQuiz = req.body;
      const newValues = { $set: updatedQuiz };
      const result = await quizCollection.updateOne(query, newValues);
      res.send(result);
    })

    // post user quiz mark
    app.post("/scores", async (req, res) => {
      const score = req.body;
      const result = await scoresCollection.insertOne(score);
      res.send(result);
    });

    // get indivisul user score
    app.get("/scores/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const cursor = scoresCollection.find(query);
      const scores = await cursor.toArray();
      res.send(scores);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send({ message: "Nexus quiz server is running " });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
