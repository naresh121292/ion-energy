const express = require('express')
const app = express()
const router = express.Router()
var multer = require('multer');
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true, parameterLimit: 10000000 }));
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET")
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    res.header("Access-Control-Allow-Credentials", "true")
    next()
});
app.use('/', router)

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
var fileFolder = 'uploads/';
var fs = require('fs')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, fileFolder)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), function (req, res) {
    console.log(req.file.path);
    var buf = '';
    var tempBuf = null
    var resultData = []
    var check = null
    var stream = fs.createReadStream('./' + req.file.destination + req.file.filename, { flags: 'r', encoding: 'utf-8' });

    stream.on('data', function (d) {
        if (tempBuf == null) {
            buf = d.toString();
        }
        else {
            if (tempBuf.length == 1 && (d.toString())[0] == ',') {
                buf = tempBuf + d.toString().substr(1)
            }
            else {
                buf = tempBuf + d.toString();
            }
        }
        var data = buf.substr(0, buf.lastIndexOf('}') + 1) + "]"
        tempBuf = "[" + buf.substr(buf.lastIndexOf('}') + 2)
        try {
            var jsonArr = JSON.parse(data)
            if (resultData.length <= 100000) {
                resultData = [...resultData, ...jsonArr]
            }
            jsonArr = []
        }
        catch (e) {
            console.error(data)
        }
    });
    stream.on('end', function () {
        buf = ''
        tempBuf = null
        var resultObj = {}
        resultObj.status = "success"
        resultObj.data = [];
        for (let index = 0; index < 100000; index++) {
            var time_stamp = new Date(resultData[index].ts);
            resultObj.data.push({time_stamp: time_stamp,
                val: resultData[index].val
            })
        }
        res.json(resultObj)
        res.end()
    });
});



var server = app.listen(8088, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Listening to port at http://localhost:%s", port);
});