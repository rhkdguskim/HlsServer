var express = require("express");
var fs = require("fs");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const router = express.Router();


ffmpeg.setFfmpegPath(ffmpegInstaller.path);

var MyCam = require('onvif').Cam;

let MyCameraList = [];

router.get("/add", (req, res) => {
    res.render("../camera/add", {CameraList : MyCameraList})
  })

router.post("/add", (req, res) => {
    console.log(req.body.camname, req.body.hostname,req.body.username,req.body.password, req.body.port);
    NewCam(req.body.camname, req.body.hostname,req.body.username,req.body.password, req.body.port);
    res.redirect(`/camera/`);
 })

router.get("/", (req, res) => {
    res.render("../camera/index", {CameraList : MyCameraList})
 })

 router.get("/live", (req, res) => {
    res.render("../camera/live2", { camname: req.query.camname })
  })

  router.get("/camlist", (req, res) => {
    res.send(MyCameraList);
  })


 function NewCam(camname, hostname, username, password, port)
 {
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
            
            const command = ffmpeg('./test.mp4')
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
            MyCameraList.push({"hostname":hostname, "port":port, "username":username , "password":password, "camname":camname});
        });
    });
 }


module.exports = router