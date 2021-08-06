import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/pastes", async (req, res) => {
  try {
    const dbres = await client.query('select * from paste_text');
    res.json(dbres.rows);
    
  } catch (error) {
    console.error(error.message)
    res.status(404).json({
      status: "fail",
      error: error.message
    }) 
  }
});

app.post("/pastes", async (req, res) => {
  const {paste_text, paste_title} = req.body;
  try {
    await client.query('INSERT INTO paste_text (paste_text, paste_title) VALUES ($1, $2)', [paste_text, paste_title])

    res.status(201).json({
      status: "success",})
    
  } catch (error) {
      console.error(error.message)
      res.status(400).json({
        status: "fail",
        error: error.message
    });

  }
})

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
