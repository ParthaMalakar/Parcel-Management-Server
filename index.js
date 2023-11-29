const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
    const paymentCollection = client.db("ParcelDB").collection("payments");
    const userCollection = client.db("ParcelDB").collection("users");
    const parcelCollection = client.db("ParcelDB").collection("parcels");
    const reviewCollection = client.db("ParcelDB").collection("reviews");
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    


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

    app.get('/parcel', async (req, res) => {
      const { startDate, endDate } = req.query;
    
      const dateFilter = {};
  
      if (startDate && endDate) {
          dateFilter.parcelDate = {
              $gte: new Date(startDate).toISOString(),
              $lte: new Date(endDate).toISOString()
          };
      } else if (startDate) {
          dateFilter.parcelDate = { $gte: new Date(startDate).toISOString() };
      } else if (endDate) {
          dateFilter.parcelDate = { $lte: new Date(endDate).toISOString() };
      }
  
      try {
          // Find parcels matching the date range
          const parcels = await parcelCollection.find(dateFilter).toArray();
          res.json(parcels);
      } catch (error) {
          console.error(error);
          res.status(500).send('Internal Server Error');
      }
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
    app.get('/users/delivary', async (req, res) => {
      const query = { Role: 'DeliveryMen' };
      const user = await userCollection.find(query).toArray();
      console.log(user)
      res.send(user);
    })
    app.get('/topdelavery', async (req, res) => {
      const query = { Role: 'DeliveryMen' };
      const topdelavery = await userCollection
        .find(query)
        .sort([
          ['delaveryCount', -1],  
          ['averageReview', -1]   
        ])
        .limit(5)
        .toArray();
      res.send(topdelavery);
    })
    app.get('/all/men', async (req, res) => {
      const query = { status: 'delivered' };
      const user = await parcelCollection.find(query).toArray();
      const man = user.length
      res.send({ man });
    })

    app.put('/parcel/one/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updated = req.body;
console.log(updated,id)
      const updateditem = {
        $set: {
          status: updated.status,
          delaverMenId:updated.delaverMenId,
          delaveryDate:updated.delaveryDate
        }
      }

      const result = await parcelCollection.updateOne(filter, updateditem, options);
      res.send(result);
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
    app.get('/count/:email', async (req, res) => {
      const email = req.params.email;
      const query = { delaverMenId: email };
      const parcel = await parcelCollection.find(query).toArray();
      
      res.send(parcel);
    });

    app.put('/user/update/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { email : id }
      const existingUser = await userCollection.findOne(filter);
      const updatedDoc = {
        $set: {
          averageReview:(parseFloat(item.averageReview) + parseFloat(existingUser?.averageReview))/2

        }
      }

      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
    });
    app.put('/user/parcel/:id', async (req, res) => {
      
      const id = req.params.id;
      const filter = { email : id }
      const existingUser = await userCollection.findOne(filter);
      const updatedDoc = {
        $set: {
          parcelbook: 1 + parseFloat(existingUser?.parcelbook)

        }
      }

      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
    });
    app.put('/user/delaveried/:id', async (req, res) => {
      
      const id = req.params.id;
      const filter = { email : id }
      const existingUser = await userCollection.findOne(filter);
      const updatedDoc = {
        $set: {
          delaveryCount: 1 + parseFloat(existingUser?.delaveryCount)

        }
      }

      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await userCollection.find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    })
    app.patch('/user/admin/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          Role:item.Role
        }
      }

      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
    });
    app.get('/userCount', async (req, res) => {
      const count = await userCollection.estimatedDocumentCount();
      res.send({ count });
    })
    app.get('/review/:email', async (req, res) => {
      const email = req.params.email;
      const query = { delaverMenId: email };
      const parcel = await reviewCollection.find(query).toArray();
      
      res.send(parcel);
    });
   
    app.get('/parcelCount', async (req, res) => {
      const count = await parcelCollection.estimatedDocumentCount();
      res.send({ count });
    })

    //Payment
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount, 'amount inside the intent')

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })
    
    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);

      //  carefully delete each item from the cart
      console.log('payment info', payment);
      const query = {
        _id: {
          $in: payment.ParcelIds?.map(id => new ObjectId(id))
        }
      };

      const updatedDoc = {
        $set: {
          price:'0'
        }
      }

      const result = await parcelCollection.updateMany(query, updatedDoc)

      

      res.send({ paymentResult, result });
    })
    app.get('/payments/:email', async (req, res) => {
      const query = { email: req.params.email }
      // if (req.params.email !== req.decoded.email) {
      //   return res.status(403).send({ message: 'forbidden access' });
      // }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

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