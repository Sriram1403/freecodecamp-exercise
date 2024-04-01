require('dotenv').config();

console.log(process.env.DB_URI);

const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Basic Configuration
try {
    mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
} catch (err) {
    console.log(err);
}

const port = process.env.PORT || 3000;

// Model
const schema = new mongoose.Schema(
    {
        original: { type: String, required: true },
        short: { type: Number, required: true }
    }
);
const Url = mongoose.model('Url', schema);

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get("/api/shorturl/:input", (req, res) => {
    const input = parseInt(req.params.input);

    Url.findOne({ short: input })
        .then(data => {
            if (!data) return res.json("URL NOT FOUND");
            res.redirect(data.original);
        })
        .catch(err => console.error(err));
});

app.post("/api/shorturl", async (req, res) => {
    const bodyUrl = req.body.url;
    const urlRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/);

    if (!bodyUrl.match(urlRegex)) {
        return res.json({ error: "Invalid URL" });
    }

    let index = 1;

    try {
        const data = await Url.findOne({}).sort({ short: 'desc' });
        index = data ? data.short + 1 : index;

        const newUrl = await Url.findOneAndUpdate(
            { original: bodyUrl },
            { original: bodyUrl, short: index },
            { new: true, upsert: true }
        );

        res.json({ original_url: bodyUrl, short_url: newUrl.short });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
