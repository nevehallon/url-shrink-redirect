require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;

module.exports = async (req, res) => {
  const id = req.query.i;
  if (id == undefined) {
    // no id
    res.json({
      status: false,
      msg: "Id is required",
    });
  } else if (id == "") {
    // empty id
    res.json({
      status: false,
      msg: "Id is required",
    });
  } else {
    // id is ok
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
          const search = { tid: id };
          var dbo = db.db("PixelDB"); // db name
          dbo
            .collection("data")
            .find(search)
            .toArray(function (errorr, result) {
              if (errorr) {
                // if error while fetching
                res.json({
                  status: false,
                  msg: "Error while fetch database",
                });
              } else {
                if (result[0] == undefined) {
                  res.json({
                    status: false,
                    msg: "Cannot find a Url with the ID",
                  });
                } else {
                  res.writeHead(302, { Location: result[0].url });
                  res.end();
                }
              }
              db.close();
            });
        }
      }
    );
  }
};
