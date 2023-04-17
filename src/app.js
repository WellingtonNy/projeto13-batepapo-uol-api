import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"



const app = express()

app.use(cors())
app.use(express.json())
dotenv.config()


const mongoClient = new MongoClient(process.env.DATABASE_URL)
try {
    await mongoClient.connect()
    console.log('Conectado DBmongo')
} catch (err) {
    console.log(err.message)
}
const db = mongoClient.db()


//post usuario
app.post("/participants", async (req, res) => {
  const{name}=req.body
  
  const usuarioSchema = joi.object({
  name: joi.string().required(),
  });
  
  const validation = usuarioSchema.validate(req.body,{abortEarly: false})

  if(validation.error){
    console.log(validation.error.details);
    const errors =validation.error.details.map(datail => datail.message)
    return res.status(422).send(errors)
  }


  try{
    const usuario = await db.collection('participants').findOne({name: name})
    if(usuario) return res.status(409).send('Usuario Já existente')

    const cadastro ={
		name: name,
		lastStatus: Date.now()}
    
    const msgCadastro={
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format("hh:mm:ss")
            }    

    await db.collection('participants').insertOne(cadastro)
     await db.collection('messages').insertOne(msgCadastro)

     res.sendStatus(201)
}

    catch (err){
    res.status(500).send(err.message)
    }
})


//get participantes

app.get("/participants", async (req, res) => {
    try{
  
    const usuarios = await db.collection("participants").find().toArray()
    res.send(usuarios)
}

    catch(err){

        res.status(500).send(err.message)
    }
})


//post mensagem

app.post("/messages", async (req, res) => {
    const time = dayjs().format("hh:mm:ss")
    const {to,text,type}=req.body
    const from = req.headers.user

    const msgSchema = joi.object({

        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid("private_message","message" ).required()
      })

      const validation = msgSchema.validate(req.body,{abortEarly: false})

      if(validation.error){
    console.log(validation.error.details);
    const errors = validation.error.details.map(datail => datail.message)
    return res.status(422).send(errors)
  }
    
  const usuarioT = await db.collection("participants").findOne({name: from});

if (!usuarioT) {
      return res.status(422).send('Destinatario não encontrado');
    }

const msg ={to,text,type,from,time}

    try {

        await db.collection("messages").insertOne(msg)

    } catch (err) {
        res.status(500).send(err.message)
    }
})


//outra coisa



const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
