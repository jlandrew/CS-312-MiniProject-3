import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "BlogDB",
  password: "postgresPassword",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.set('view engine', 'ejs');

let posts = [];
let resultRows = [];
let temp = [];
let currUser = [];

// render sign up page
app.get("/", async (req, res) => {
  res.render("sign-up.ejs", {
    userExists: false,
  });
});

// render sign in page
app.get("/signin", async (req, res) => {
  res.render("sign-in.ejs", {
    userCorrect: true,
  });
});

// add login for new user
app.post("/addLogin", async (req, res) => {
  const username = req.body.newUser;
  const name = req.body.newName;
  const pass = req.body.newPass;
  try {
    const result = await db.query("SELECT * FROM users WHERE user_id = $1", [username]);
    resultRows = result.rows;

    if (resultRows && resultRows.length === 0) {
      await db.query("INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)", [username, pass, name]);
      temp = await db.query("SELECT * FROM users WHERE user_id = $1", [username]);
      currUser = temp.rows;
      res.redirect("/blogs");
    }
    else {
      res.render("sign-up.ejs", {
        userExists: true,
      });
    }
  } catch (err) {
      console.log(err);
    }
});

// login for existing user
app.post("/login", async (req, res) => {
  const username = req.body.tryUser;
  const pass = req.body.tryPass;
  try {
    const result = await db.query("SELECT * FROM users WHERE user_id = $1 AND password = $2", [username, pass]);
    resultRows = result.rows;

    if (resultRows && resultRows.length === 0) {
      res.render("sign-in.ejs", {
        userCorrect: false,
      });
    }
    else {
      temp = await db.query("SELECT * FROM users WHERE user_id = $1", [username]);
      currUser = temp.rows;
      res.redirect("/blogs");
    }
  } catch (err) {
      console.log(err);
    }
});

// render inedx page
app.get("/blogs", async (req, res) => {
  try {    
    const result = await db.query("SELECT * FROM blogs ORDER BY blog_id DESC;");
    posts = result.rows;
    
    // convert time
    for (let i = 0; i < posts.length; ++i) {
      const date = new Date(posts[i].date_created);

      // Format as MM/DD/YYYY H:MM (no seconds, 12-hour clock)
      let formatted = new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
      posts[i].date_created = formatted; 
    }

    res.render("index.ejs", {
      currUser: currUser,
      blogPost: posts,
    });
  } catch (err) {
    console.log(err);
  }
});

// add a post from the user
app.post('/addPost', async (req, res) => {
  const postTitle = req.body.newTitle;
  const postBody = req.body.newBody;
  try {
    await db.query("INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)", [currUser[0].name, currUser[0].user_id, postTitle, postBody]);
    res.redirect("/blogs");

  } catch (err) {
    console.log(err);
  }
});

// edit a user's post
app.post("/edit", async (req, res) => {
  const newTitle = req.body.updatedTitle;
  const newBody = req.body.updatedBody;
  const id = req.body.updatedId;

  try {
    const result = await db.query("SELECT * FROM blogs WHERE blog_id = $1", [id]);
    resultRows = result.rows;
    if (currUser[0].user_id == resultRows[0].creator_user_id) {
      await db.query("UPDATE blogs SET title = ($1), body = ($2) WHERE blog_id = $3", [newTitle, newBody, id]);
      res.redirect("/blogs");
    } else {
      res.redirect("/blogs");
    }
  } catch (err) {
    console.log(err);
  }
});

// delete a user's post
app.post("/delete", async (req, res) => {
  const id = req.body.deleteItemId;
  try {
    const result = await db.query("SELECT * FROM blogs WHERE blog_id = $1", [id]);
    resultRows = result.rows;
    
    if (currUser[0].user_id == resultRows[0].creator_user_id) {
      await db.query("DELETE FROM blogs WHERE blog_id = $1", [id]);
      res.redirect("/blogs");
    }
    else {
      res.redirect("/blogs");
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});