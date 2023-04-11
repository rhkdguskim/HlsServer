var express = require("express");
var fs = require("fs");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const router = express.Router();


ffmpeg.setFfmpegPath(ffmpegInstaller.path);

var MyCam = require('onvif').Cam;

let MyCameraList = [];

let Mymp4List = [];

router.get("/", (req, res) => {
    res.render("../camera/index", {DataList : {"cameralist":MyCameraList , "mp4list":Mymp4List}})
 })

router.get("/add", (req, res) => {
    res.render("../camera/add")
  })

router.post("/add", (req, res) => {
    console.log(req.body.camname, req.body.hostname,req.body.username,req.body.password, req.body.port);
    NewCam(req.body.camname, req.body.hostname,req.body.username,req.body.password, req.body.port);
    res.redirect("/camera")
 })

 
router.get("/addmp4", (req, res) => {
    res.render("../camera/addmp4")
  })

 router.post("/addmp4", (req, res) => {
    console.log(req.body.filename, req.body.filepath);
    NewCamMp4(req.body.filename, req.body.filepath);
    res.redirect("/camera")
 })

 router.get("/live", (req, res) => {
    res.render("../camera/live", {DataList : {"camname":req.query.camname,"cameralist":MyCameraList , "mp4list":Mymp4List}})
  })

  router.get("/camlist", (req, res) => {
    res.send(MyCameraList);
  })

  router.get("/mp4list", (req, res) => {
    res.send(Mymp4List);
  })

 function NewCam(camname, hostname, username, password, port)
 {
    fs.rmdir(`hls/${camname}`, { recursive: true }, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log('Dir is deleted.');
        }
      });

    new MyCam({
        hostname,
        username,
        password,
        port
    }, function(err) {
        if (err) {
            console.log('Connection Failed for ' + hostname + ' Port: ' + port + ' Username: ' + username + ' Password: ' + password);
            return;
        }
        console.log('Camera is Connected');
        this.getStreamUri({protocol: 'RTSP'}, function(err, stream) {
            console.log(stream.uri);

            fs.mkdir(`hls/${camname}`, (err) => {
                if (err) throw err;
              });
            
            const command = ffmpeg(stream.uri)
            .outputOptions([
                '-hls_time 15',
                `-hls_segment_filename hls/${camname}/%03d.ts`,
                '-f hls'
            ])
            .output(`hls/${camname}/play.m3u8`)
            .on('start', function() {
                console.log(`${camname} is Started`);
            })
            .on('end', function(err, stdout, stderr) {
                console.log(`${camname} is Finished`)
            }).run()
            MyCameraList.push({"hostname":hostname, "port":port, "username":username , "password":password, "camname":camname , "streamuri":stream.uri});
        });
    });
 }

 function NewCamMp4(filename, filepath)
 {
    fs.rmdir(`hls/${filename}`, { recursive: true }, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log('Dir is deleted.');
        }
      });

    fs.mkdir(`hls/${filename}`, (err) => {
        if (err) throw err;
      });

    const command = ffmpeg(filepath)
    .outputOptions([
        '-hls_time 15',
        `-hls_segment_filename hls/${filename}/%03d.ts`,
        '-f hls'
    ])
    .output(`hls/${filename}/play.m3u8`)
    .on('start', function() {
        console.log(`${filename} is Started`);
    })
    .on('error', function(err, stdout, stderr) {
        if (err) {
            console.log(err.message);
            console.log("stdout:\n" + stdout);
            console.log("stderr:\n" + stderr);
            reject("Error");
        }
    })
    .on('end', function(err, stdout, stderr) {
        fs.rmdir(`hls/${filename}`, { recursive: true }, (err) => {
            if (err) {
              console.log(err)
            } else {
              console.log('Dir is deleted.');
            }
          });
    }).run()

    Mymp4List.push({"filename":filename});
 }


module.exports = router