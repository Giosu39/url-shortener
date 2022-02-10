require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// Mongoose Schema and Model
const Schema = mongoose.Schema;
const urlPairSchema = new Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: Number },
});
const UrlPair = mongoose.model("UrlPair", urlPairSchema);

// Redirection
app.get("/api/shorturl/:number", function (req, res) {
  let number = req.params.number;
  let numberRegex = /^\d+$/;
  if (numberRegex.test(number) === false) {
    res.json({ error: "Invalid URL" });
  } else {
    UrlPair.findOne({ shortUrl: number }, function (err, pair) {
      if (err) {
        console.error(err);
      } else {
        if (pair === null) {
          res.json({ error: "Invalid URL" });
        } else {
          res.redirect(pair.originalUrl);
        }
      }
    });
  }
});

// Short Url Creation
app.post("/api/shorturl", function (req, res) {
  let originalUrl = req.body.url;
  let urlRegex =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
  if (urlRegex.test(originalUrl) === false) {
    res.json({ error: "Invalid URL" });
  } else {
    var numUrlPair = 1;
    UrlPair.findOne({ originalUrl: originalUrl }, function (err, pair) {
      if (err) {
        console.error(err);
      } else {
        if (pair === null) {
          // Find the highest existing value of "ShortUrl"
          var numUrlPair = 0;
          UrlPair.findOne({})
            .sort({ shortUrl: "desc" })
            .exec((error, data) => {
              if (!error && data != undefined) {
                var numUrlPair = data.shortUrl + 1;
              }
              // Create the new URL pair
              UrlPair.create(
                {
                  originalUrl: originalUrl,
                  shortUrl: numUrlPair,
                },
                function (err, newPair) {
                  if (err) {
                    return console.error(err);
                  } else {
                    res.json({
                      original_url: newPair.originalUrl,
                      short_url: newPair.shortUrl,
                    });
                  }
                }
              );
            });
        } else { // Already existing URL
          res.json({
            original_url: pair.originalUrl,
            short_url: pair.shortUrl,
          });
        }
      }
    });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
