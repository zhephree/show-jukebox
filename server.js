const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const glob = require("glob");
const fs = require('fs');
const bodyParser = require('body-parser');


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
}));

app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
})

app.get('/api/songs', (req,res) => {
    let filelist = [];
    filelist = filelist.concat(glob.sync("public/songs/*.mp3"));
    filelist = filelist.concat(glob.sync("public/songs/*.wav"));
    filelist = filelist.concat(glob.sync("public/songs/*.m4a"));
    filelist.sort();

    const result = filelist.map((value) => {
        return value.replace('public/songs/', '');
    })

    res.contentType('application/json').send(JSON.stringify(result));
})

app.post('/api/shows', (req, res) => {
    const showName = req.body.name;
    const filename = showName.replace(/\s+/g, '_').replace(/(\*|\?|\/|\\)/g, '');

    fs.writeFile(path.join(__dirname, 'data/' + filename + '.json'), JSON.stringify({name: showName}), function(err){
        if(err){
            res.json({success: false, error: err});
        }else{
            res.json({success: true})
        }
    })  
})

app.put('/api/shows', (req, res) => {
    const showName = req.body.showName;
    const filename = showName.replace(/\s+/g, '_').replace(/(\*|\?|\/|\\)/g, '');

    fs.writeFile(path.join(__dirname, 'data/' + filename + '.json'), JSON.stringify({
        name: showName,
        intro: req.body.intro,
        outro: req.body.outro,
        ...req.body
    }), function(err){
        if(err){
            res.json({success: false, error: err});
        }else{
            res.json({success: true})
        }
    })  
})

app.get('/api/shows', (req, res) => {
    const show_files = glob.sync('data/*.json');
    let result = [];

    for(let i = 0; i < show_files.length; i++){
        const file = show_files[i];
        console.log('file', file)
        fs.readFile(path.join(__dirname, file), function(err, data){
            if(err){
                res.json({success: false, error:err});
            }else{
                const json = JSON.parse(data); console.log({json});
                const showName = json.name; console.log({showName})
                const fparts = file.split('/'); console.log({fparts})
                const filename = fparts[fparts.length - 1]; console.log({filename})
                const handle = filename.replace('.json', ''); console.log({handle})

                result.push({handle, showName, ...json});

                if(i === show_files.length - 1){
                    res.json({success: true, shows: result});
                    console.log('sent')                
                }
            }
        })
    }

})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})