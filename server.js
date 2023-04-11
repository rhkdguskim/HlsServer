var express = require("express");
var app = express();
app.set("view engine", "ejs");
var HLSServer = require("hls-server");

var hls = new HLSServer(app, {
    provider: {
      exists: function (req, callback) { // check if a file exists (always called before the below methods)
        callback(null, true)                 // File exists and is ready to start streaming
        callback(new Error("Server Error!")) // 500 error
        callback(null, false)                // 404 error
      },
      getManifestStream: function (req, callback) { // return the correct .m3u8 file
        // "req" is the http request
        // "callback" must be called with error-first arguments
        callback(null, myNodeStream)
        // or
        callback(new Error("Server error!"), null)
      },
      getSegmentStream: function (req, callback) { // return the correct .ts file
        callback(null, myNodeStream)
      }
    }
  })

const searchCam = require("./routes/SearchCam");
const addCam = require("./routes/Camera");
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use("/SearchCam",searchCam);
app.use("/Camera",addCam);
app.use(express.static("hls"))


app.listen(8000, function(){
    console.log("8000 port is listening!! ");
});