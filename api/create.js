/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const request = require("request");
const fetch = require("node-fetch");
const regex = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/; // validate url

const baseUrl = "https://og-image-html.vercel.app/ ?images=";

module.exports = async (req, res) => {
  const url = req.query.u;
  if (url == undefined) {
    // no url
    res.json({
      status: false,
      msg: "Url is missing",
    });
  } else if (!regex.test(url)) {
    // validate url
    res.json({
      status: false,
      msg: "Bad URL kindly recheck url and send again",
    });
  } else {
    // url is ok
    MongoClient.connect(
      process.env.DB_URL,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      function (err, db) {
        // connect with db
        if (err) {
          res.json({
            status: false,
            msg: "Cannot connect with Database",
          });
        } else {
          //getting time
          var options = {
            method: "GET",
            url: "https://time.akamai.com/",
          };
          request(options, function (error, response) {
            if (error) {
              // if error fetching time
              res.json({
                status: false,
                msg: "Failed to get time data",
              });
            } else {
              //generate random string
              function randomString(length, chars) {
                var result = "";
                for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
                return result;
              }
              var rString = randomString(6, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
              var timestamp = Number(response.body) + Number("19800"); // gmt to ist
              var tidd = timestamp + rString; //added generated string

              //saving data into db
              var dbo = db.db("PixelDB"); // db name
              var obj = {
                tid: tidd,
                ist: timestamp,
                url: `${baseUrl}${encodeURIComponent(url.replace(baseUrl, ""))}`,
              };
              dbo.collection("data").insertOne(obj, function (erorr, result) {
                if (erorr) {
                  // if error while writing
                  res.json({
                    status: false,
                    msg: "Error while write on database",
                  });
                } else {
                  var link = process.env.APP_URL + "/?i=" + result.ops[0].tid;
                  // res.json({
                  //   //if everything goes correct
                  //   status: true,
                  //   link,
                  //   unique_id: result.ops[0].tid,
                  //   timestamp: result.ops[0].ist,
                  // });
                  try {
                    fetch(
                      "https://graph.facebook.com/v10.0/?access_token=1147993589050014%7Cm0H7F-TI2TnqQtJjTLjHax5OHV8",
                      {
                        headers: {
                          accept: "*/*",
                          "accept-language": "en-US,en;q=0.9",
                          "content-type": "application/x-www-form-urlencoded",
                          "sec-ch-ua": "' Not A;Brand';v='99', 'Chromium';v='90', 'Google Chrome';v='90'",
                          "sec-ch-ua-mobile": "?0",
                          "sec-fetch-dest": "empty",
                          "sec-fetch-mode": "cors",
                          "sec-fetch-site": "same-site",
                        },
                        referrer: "https://developers.facebook.com/",
                        referrerPolicy: "origin-when-cross-origin",
                        body:
                          "debug=all&format=json&id=" +
                          link +
                          "&method=post&pretty=0&scrape=true&suppress_http_code=1&transport=cors",
                        method: "POST",
                        mode: "cors",
                      }
                    )
                      .then((res) => res.json())
                      .then((data) =>
                        res.json({
                          //if everything goes correct
                          data,
                          status: true,
                          link,
                          unique_id: result.ops[0].tid,
                          timestamp: result.ops[0].ist,
                        })
                      );
                  } catch (error) {}
                }
                db.close();
              });
            }
          });
        }
      }
    );
  }
};
