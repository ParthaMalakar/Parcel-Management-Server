const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.noswvlt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {




    const userCollection = client.db("ParcelDB").collection("users");
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;

      
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })
    app.get('/users/user/:email', async (req, res) => {
      const email = req.params.email;

      
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let usera = false;
      if (user) {
        usera = user?.Role === 'User';
      }
      res.send({ usera });
    })
    app.get('/users/delivary/:email', async (req, res) => {
      const email = req.params.email;

      console.log(email)
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let delivary = false;
      console.log(user)
      if (user) {
        delivary = user?.Role === 'DeliveryMen';
      }
      console.log(delivary)
      res.send({ delivary });
    })
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('server is running');
})
app.listen(port, () => {
  console.log(`Parcel web server is running port${port}`)
})