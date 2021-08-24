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

app.get("/pastes/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const dbres = await client.query('select * from paste_text WHERE id=$1', [id]);
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
  const {pasteText, pasteTitle} = req.body;
  // console.log(paste_text)
  // console.log(paste_title)
  try {
    await client.query('INSERT INTO paste_text (paste_text, paste_title) VALUES ($1, $2)', [pasteText, pasteTitle])

    res.status(201).json({
      status: "success",})
    
  } catch (error) {
      console.error(error.message)
      res.status(400).json({
        status: "fail",
        error: error.message
    });

  }
});

//create put request
app.put("/pastes/:id", async (req, res) => {

  const id = parseInt(req.params.id);
  const {pasteText, pasteTitle} = req.body;
  
  try {
    await client.query('UPDATE paste_text SET paste_text=$1, paste_title=$2 WHERE id=$3', [pasteText, pasteTitle, id])
    res.status(201).json({
      status: "success",})

  } catch (error) {
    console.error(error.message)
    
  }
  
});

app.delete("/pastes/:id", async (req, res) => {
  const id = parseInt(req.params.id);


  try {
    await client.query('DELETE FROM comments WHERE paste_id = $1', [id]);
    await client.query('DELETE FROM paste_text WHERE id = $1', [id]);
    res.status(200).json({
      status: "success",
    });
    
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: {
        error: ("Could not find a signature with that id identifier"),
      },
    }); 
  }

  }
);


///////// comments /////////

app.get("/pastes/comments/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  //console.log(res);

  try {
    const response = await client.query('SELECT * FROM comments WHERE paste_id = $1', [id]);
    res.json(response.rows);
    // const responseJson = res.json(response.rows);
    // console.log(responseJson)
    
    
  } catch (error) {
    console.error(error.message)
    res.status(404).json({
      status: "fail",
      error: error.message
    }) 
  }
});


app.delete("/comments/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const queryResult: any = await client.query('DELETE FROM comments WHERE comment_id = $1;', [id]);
    // const didRemove = queryResult.rowCount === 1;
    res.status(200).json({
      status: "success",
    });
    
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: {
        error: ("Could not find a signature with that id identifier"),
      },
    }); 
    
  }
})

  // if (didRemove) {
  //   // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE#responses
  //   // we've gone for '200 response with JSON body' to respond to a DELETE
  //   //  but 204 with no response body is another alternative:
  //   //  res.status(204).send() to send with status 204 and no JSON body
    
  // } 
  // }


//app.post("/pastes/:id/comments", async (req, res) => {
app.post("/pastes/comments", async (req, res) => {
  // const id = parseInt(req.params.id);
  const {comment, id} = req.body;

  try {
    await client.query('INSERT INTO comments (comment, paste_id) VALUES ($1, $2)', [comment, id])
    
    res.status(201).json({
      status: "success",})
    
  } catch (error) {
      console.error(error.message)
      res.status(400).json({
        status: "fail",
        error: error.message
    });

  }
});



//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
