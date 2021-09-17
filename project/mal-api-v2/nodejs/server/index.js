const express = require("express");
const cors = require("cors");
const { join: pathJoin } = require("path");
const router = require("./router");

const port = 8080;
const homeUrl = `http://localhost:${port}`;
const oauth2Opt = {
	clientId: "xxx",
	clientSecret: undefined, // Optional can remove
	urlRedirect: `${homeUrl}/oauth2`, // Optional can remove
	dataBase: pathJoin(__dirname, "databse.json"),
};

const app = express();
app.use(cors());

app.use("/oauth2", router.oauth2(oauth2Opt));

app.listen(port, () => console.log(`server has started on ${homeUrl} 🚀`));
