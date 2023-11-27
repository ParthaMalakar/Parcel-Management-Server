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
    const parcelCollection = client.db("ParcelDB").collection("parcels");
    const reviewCollection = client.db("ParcelDB").collection("reviews");
    app.post('/review', async (req, res) => {
      const item = req.body;
      const result = await reviewCollection.insertOne(item);
      res.send(result);
    });
    app.post('/parcel', async (req, res) => {
      const item = req.body;
      const result = await parcelCollection.insertOne(item);
      res.send(result);
    });
    app.patch('/parcel/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          phone:item.phone,
          type:item.type,
          weight:item.weight,
          ReceiverName:item.ReceiverName,
          ReceiverPhone: item.ReceiverPhone,
          parcelAddress:item.parcelAddress,
          parcelDate:item.parcelDate,
          Latitude:item.Latitude,
          longitude:item.longitude,
          price: item.price
        }
      }

      const result = await parcelCollection.updateOne(filter, updatedDoc)
      res.send(result);
    });
    app.patch('/parcel/cancel/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          status:item.status
        }
      }

      const result = await parcelCollection.updateOne(filter, updatedDoc)
      res.send(result);
    });


    app.get('/parcel/:email', async (req, res) => {
      const email = req.params.email;
      const query = { Email: email };
      const parcel = await parcelCollection.find(query).toArray();
      res.send(parcel);
    });
    app.get('/parceldetail/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const parcel = await parcelCollection.findOne(query);
      res.send(parcel);
    });
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;

      
      const query = { email: email };
      const user = await userCollection.findOne(query);
      console.log(user)
      let admin = false;
      if (user) {
        admin = user?.Role === 'admin';
      }
      console.log(admin)
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

     
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let delivary = false;
      console.log(user)
      if (user) {
        delivary = user?.Role === 'DeliveryMen';
      }
      
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