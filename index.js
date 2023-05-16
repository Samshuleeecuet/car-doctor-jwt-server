const express = require('express');
const cors = require('cors');
jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
//console.log(process.env.DB_USER,process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.df1ioxo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = (req,res,next) =>{
  //console.log('hit verify JWT')
 // console.log(req.headers.authorization)
  const authorization = req.headers.authorization; 
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'})
  }
  const token = authorization.split(' ')[1];
    console.log('token inside', token)
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error,decoded)=>{
      if(error){
        return res.status(403).send({error: true, message: 'unauthorized access'}) 
      }
      req.decoded = decoded;
      next();
    })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const database = client.db("ServicesDb");
    const haiku = database.collection("Services");
    const order = database.collection("Orders")

    //jwt

    app.post('/jwt',(req,res)=>{
      const user = req.body;
      //console.log(user)
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1h'})
      //console.log(token);
      res.send({token});

    })

    //services
    app.get('/services',async(req,res)=>{
        const cursor = haiku.find();
        const result = await cursor.toArray();
        res.send(result);
    })
    app.get('/orders',verifyJWT,async(req,res)=>{
      
      //console.log(req.headers.authorization)
      const decoded = req.decoded;
      console.log(decoded);
      if(decoded.email !== req.query.email){
        return res.status(403).send({error: true, message: 'forbidden access'})
      }
      let query = {};
      if(req.query.email){
        query= {email: req.query.email}
      }
      const cursor = order.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })
    app.delete('/orders/:id',async(req,res)=>{
      const id  = req.params.id;
      const query= {_id: new ObjectId(id)}
      const result = await order.deleteOne(query)
      res.send(result)
    })
    app.patch('/orders/:id', async(req,res)=>{
      const id = req.params.id;
      const update = req.body;
      const query  = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          status: update.status,
        },
      };
      const result = await order.updateOne(query, updateDoc);
      res.send(result);
    })

    app.put('/orders/:id',async(req,res)=>{
      const id  = req.params.id;
    })

    app.post('/services',async(req,res)=>{
        const newService = req.body;
        const result = await haiku.insertOne(newService);
        res.send(result);
    })

    app.get('/services/:id',async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const query = {_id: new ObjectId(id)}
      const options = {}
      const result = await haiku.findOne(query,options)
      res.send(result)
    })
    
    app.post('/checkout',async(req,res)=>{
      const checkout = req.body;
      const result = await order.insertOne(checkout);
      res.send(result);
    })
    

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port);
